import librosa
import numpy as np
import parselmouth
import webrtcvad
import whisper
import spacy
from textblob import TextBlob
import json
import sys
import os

# Helper: Extract MFCCs
def extract_mfccs(y, sr, n_mfcc=13):
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    return mfccs.mean(axis=1).tolist()

# Helper: Extract pitch (mean, std, range)
def extract_pitch(y, sr):
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitches = pitches[magnitudes > np.median(magnitudes)]
    if len(pitches) == 0:
        return 0, 0, 0
    return float(np.mean(pitches)), float(np.std(pitches)), float(np.max(pitches) - np.min(pitches))

# Helper: Extract energy (mean, std)
def extract_energy(y):
    rms = librosa.feature.rms(y=y)[0]
    return float(np.mean(rms)), float(np.std(rms))

# Helper: Extract jitter, shimmer, HNR
def extract_parselmouth(path):
    snd = parselmouth.Sound(path)
    pitch = snd.to_pitch()
    pointProcess = parselmouth.praat.call([snd, pitch], "To PointProcess (cc)")
    jitter = parselmouth.praat.call([pointProcess, pitch], "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
    shimmer = parselmouth.praat.call([snd, pointProcess], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
    hnr = parselmouth.praat.call(snd, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
    hnr_mean = parselmouth.praat.call(hnr, "Get mean", 0, 0)
    return float(jitter), float(shimmer), float(hnr_mean)

# Helper: Speech rate, pause metrics using ASR and VAD
def extract_speech_rate_and_pauses(audio_path, transcript, sr, y):
    vad = webrtcvad.Vad(2)
    frame_duration = 30  # ms
    frame_length = int(sr * frame_duration / 1000)
    n_frames = int(len(y) / frame_length)
    speech_frames = 0
    pauses = []
    pause_start = None
    for i in range(n_frames):
        start = i * frame_length
        stop = start + frame_length
        frame = y[start:stop]
        if len(frame) < frame_length:
            break
        pcm = (frame * 32767).astype(np.int16).tobytes()
        is_speech = vad.is_speech(pcm, sr)
        if is_speech:
            speech_frames += 1
            if pause_start is not None:
                pauses.append((pause_start, i))
                pause_start = None
        else:
            if pause_start is None:
                pause_start = i
    total_time = len(y) / sr
    speech_time = speech_frames * frame_duration / 1000
    pause_time = total_time - speech_time
    pause_ratio = pause_time / total_time if total_time > 0 else 0
    n_pauses = len(pauses)
    avg_pause = (pause_time / n_pauses) if n_pauses > 0 else 0
    # Speech rate: words/sec from transcript
    words = transcript.split()
    speech_rate = len(words) / total_time if total_time > 0 else 0
    return speech_rate, n_pauses, avg_pause, pause_ratio

# Helper: Pitch-energy correlation
def pitch_energy_corr(y, sr):
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_vals = pitches[magnitudes > np.median(magnitudes)]
    energy = librosa.feature.rms(y=y)[0]
    min_len = min(len(pitch_vals), len(energy))
    if min_len < 2:
        return 0
    return float(np.corrcoef(pitch_vals[:min_len], energy[:min_len])[0, 1])

# Helper: Lexical richness, filler words
def lexical_features(transcript):
    nlp = spacy.load("en_core_web_sm")
    doc = nlp(transcript)
    tokens = [token.text for token in doc if token.is_alpha]
    types = set(tokens)
    ttr = len(types) / len(tokens) if tokens else 0
    fillers = [w for w in tokens if w.lower() in ["um", "uh", "erm", "hmm"]]
    return ttr, len(fillers)

# Main extraction function
def extract_all_features(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    # Whisper ASR
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, language="en")
    transcript = result["text"]
    # Acoustic/Prosody
    pitch_mean, pitch_std, pitch_range = extract_pitch(y, sr)
    energy_mean, energy_std = extract_energy(y)
    jitter, shimmer, hnr = extract_parselmouth(audio_path)
    # Rhythm/Timing
    speech_rate, n_pauses, avg_pause, pause_ratio = extract_speech_rate_and_pauses(audio_path, transcript, sr, y)
    # Spectral
    mfccs = extract_mfccs(y, sr)
    # Expressiveness
    pitch_energy_correlation = pitch_energy_corr(y, sr)
    # Lexical
    ttr, n_fillers = lexical_features(transcript)
    return {
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "pitch_range": pitch_range,
        "energy_mean": energy_mean,
        "energy_std": energy_std,
        "jitter": jitter,
        "shimmer": shimmer,
        "hnr": hnr,
        "speech_rate": speech_rate,
        "n_pauses": n_pauses,
        "avg_pause": avg_pause,
        "pause_ratio": pause_ratio,
        "mfccs": mfccs,
        "pitch_energy_correlation": pitch_energy_correlation,
        "lexical_richness": ttr,
        "n_fillers": n_fillers,
        "transcript": transcript
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audio_emotion_features.py <audiofile.wav>")
        sys.exit(1)
    audio_path = sys.argv[1]
    features = extract_all_features(audio_path)
    print(json.dumps(features, indent=2))

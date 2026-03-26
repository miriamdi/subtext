# Quick Reference: NVC Features Implementation

## Quick Navigation

### For Users:
- See [FEATURES_GUIDE.md](FEATURES_GUIDE.md) for how to use the new features

### For Developers:
- See [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for full details
- This file for quick code reference

---

## Code Location Reference

### Explanation Buttons
**HTML:** `index.html` lines ~178-195 (NVC component headers)
```html
<div class="nvc-header">
    <h3>Component Name</h3>
    <button class="explanation-btn" data-component="observation">
        <span class="info-icon">ℹ️</span>
    </button>
</div>
```

**CSS:** `style.css` lines ~631-662 (explanation button styles)

**JS:** `app.js` 
- `initializeExplanationFeatures()` - Setup (line ~448)
- `showExplanation(component)` - Display (line ~485)
- Event listeners - `attachEventListeners()` (line ~80)

---

### Reference Guide Modal
**HTML:** `index.html` lines ~211-250 (reference modal)
```html
<div id="referenceModal" class="modal">
    <div class="modal-content reference-modal">
        <!-- Tabs and content -->
    </div>
</div>
```

**CSS:** `style.css` lines ~742-850+ (all reference styles)

**JS:** `app.js`
- `showReference()` - Open (line ~520)
- `switchReferenceTab(tabName)` - Tab switcher (line ~540)
- `renderFeelingsList()` - Render feelings (line ~560)
- `renderNeedsList()` - Render needs (line ~600)

---

### Reference Database
**JS:** `reference.js` (new file, ~430 lines)

#### Key Methods:
```javascript
nvcReference.getComponentExplanation('observation')
nvcReference.getFeelingsByCategory()
nvcReference.getNeedsByCategory()
nvcReference.searchFeelings('happy')
nvcReference.searchNeeds('autonomy')
nvcReference.getFeelingDetails('sad')
nvcReference.getNeedDetails('connection')
```

---

## Quick Customization Guide

### Add Custom Explanation
Edit `reference.js`, COMPONENT_EXPLANATIONS object:
```javascript
this.COMPONENT_EXPLANATIONS = {
    observation: {
        title: 'Observation',
        icon: '👁️',
        description: 'What did you actually see or hear, without judgment?',
        details: 'An observation is a factual...',
        why: 'Observations help create...',
        example_bad: 'You\'re being inconsiderate.',
        example_good: 'You didn\'t respond when...'
    }
    // Add more here
};
```

### Add New Feeling Category
Edit `reference.js`, FEELINGS_BY_CATEGORY:
```javascript
this.FEELINGS_BY_CATEGORY = {
    myCategory: {
        title: '🏷️ Category Name',
        description: 'Description of category',
        feelings: [
            { word: 'feeling1', definition: 'Definition here' },
            { word: 'feeling2', definition: 'Definition here' }
        ]
    }
    // Existing categories...
};
```

### Add New Need Category
Edit `reference.js`, NEEDS_BY_CATEGORY:
```javascript
this.NEEDS_BY_CATEGORY = {
    myCategory: {
        category: 'Category Name',
        icon: '🎯',
        description: 'Description',
        needs: [
            { name: 'need1', definition: 'Definition' },
            { name: 'need2', definition: 'Definition' }
        ]
    }
    // Existing categories...
};
```

### Style Changes
- Button colors: Edit `.explanation-btn` in `style.css`  
- Modal width: Edit `.reference-modal` max-width in `style.css`
- Category colors: Edit `.entry-item` border-left colors in `style.css`
- Text colors: Edit `:root` CSS variables at top of `style.css`

### Add Keyboard Navigation
Add to `initializeExplanationFeatures()` in `app.js`:
```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        this.closeExplanation();
        this.closeReference();
    }
});
```

---

## Key Class: NVCReference

### Constructor
```javascript
const nvcReference = new NVCReference();
```

### Main Methods

#### Get Component Explanation
```javascript
nvcReference.getComponentExplanation('feeling')
// Returns: { title, icon, description, details, why, example_bad, example_good }
```

#### Get Organized Data
```javascript
nvcReference.getFeelingsByCategory()  // All feelings by category
nvcReference.getNeedsByCategory()     // All needs by category
```

#### Search Methods
```javascript
nvcReference.searchFeelings('sad')
// Returns: [{ category: '😢 Sad/Sorrowful', feelings: [...] }]

nvcReference.searchNeeds('autonomy')
// Returns: [{ category: '🦁 Autonomy', icon: '🦁', needs: [...] }]
```

#### Get Details
```javascript
nvcReference.getFeelingDetails('happy')
// Returns: { word, definition, category, description }

nvcReference.getNeedDetails('connection')
// Returns: { name, definition, category, icon, description }
```

---

## Key Methods in SubtextApp (app.js)

### Modal Control
```javascript
app.showExplanation('observation')    // Show explanation
app.closeExplanation()                // Close explanation
app.showReference()                   // Open reference guide
app.closeReference()                  // Close reference guide
```

### Tab Control
```javascript
app.switchReferenceTab('feelings')    // Show feelings tab
app.switchReferenceTab('needs')       // Show needs tab
```

### Content Rendering
```javascript
app.renderFeelingsList()              // Render all feelings
app.renderNeedsList()                 // Render all needs
app.renderFeelingsList(customList)    // Render custom list
app.renderNeedsList(customList)       // Render custom list
```

### Search/Filter
```javascript
app.filterFeelings('happy')           // Filter by term
app.filterNeeds('autonomy')           // Filter by term
```

---

## CSS Classes Reference

### Buttons
- `.explanation-btn` - The info button
- `.btn-reference` - Reference guide button
- `.reference-tab-btn` - Tab buttons
- `.reference-tab-btn.active` - Active tab

### Modals
- `.modal` - Modal overlay
- `.modal-content` - Modal content box
- `.explanation-modal` - Explanation modal specific
- `.reference-modal` - Reference modal specific
- `.modal-close` - Close button

### Content
- `.reference-category` - Category container
- `.category-header` - Category header
- `.category-content` - Category content area
- `.entry-list` - List of entries
- `.entry-item` - Individual entry
- `.entry-word` - Word/name styling
- `.entry-definition` - Definition styling

### UI Elements
- `.reference-tabs` - Tab container
- `.reference-content` - Content container
- `.reference-section` - Content section (hidden/shown by tab)
- `.search-box` - Search container
- `.search-input` - Search input field

### States
- `.active` - Active tab or section
- `:hover` - Hover states
- `:focus` - Focus states

---

## HTML Structure

### Explanation Modal
```html
<div id="explanationModal" class="modal">
    <div class="modal-content explanation-modal">
        <button class="modal-close" id="closeExplanation">×</button>
        <div id="explanationContent">
            <!-- Generated by JS -->
        </div>
    </div>
</div>
```

### Reference Modal
```html
<div id="referenceModal" class="modal">
    <div class="modal-content reference-modal">
        <button class="modal-close" id="closeReference">×</button>
        <h2>NVC Reference Guide</h2>
        
        <div class="reference-tabs">
            <button class="reference-tab-btn active" data-tab="feelings">
                Feelings & Emotions
            </button>
            <button class="reference-tab-btn" data-tab="needs">
                Needs & Values
            </button>
        </div>

        <div class="reference-content">
            <div id="feelingsTab" class="reference-section active">
                <input type="text" id="feelingsSearch" 
                       placeholder="Search">
                <div id="feelingsContainer">
                    <!-- Generated by JS -->
                </div>
            </div>
            
            <div id="needsTab" class="reference-section">
                <input type="text" id="needsSearch" 
                       placeholder="Search needs...">
                <div id="needsContainer">
                    <!-- Generated by JS -->
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## Common Tasks

### Task: Add Emoji to Feeling
Edit `reference.js`, find feeling in FEELINGS_BY_CATEGORY:
```javascript
happy: {
    title: '😊 Happy / Joyful',  // Add emoji here
    // ...
}
```

### Task: Change Modal Width
Edit `style.css`:
```css
.reference-modal {
    max-width: 900px;  /* Change this value */
}
```

### Task: Hide Reference Button
Edit `app.js`, in `initializeExplanationFeatures()`:
```javascript
if (this.referenceBtn) {
    this.referenceBtn.style.display = 'none';  // Add this line
    this.referenceBtn.addEventListener('click', () => this.showReference());
}
```

### Task: Auto-open Reference on Load
Edit `app.js`, in `displayNVCResults()`:
```javascript
displayNVCResults() {
    // ... existing code ...
    this.resultsPanel.style.display = 'block';
    this.showReference();  // Add this line
}
```

### Task: Add Keyboard Shortcut
Edit `app.js`, in `initializeExplanationFeatures()`:
```javascript
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'r') {  // Alt+R for reference
        this.showReference();
    }
});
```

---

## Debugging Tips

### Check if NVCReference is Initialized
```javascript
console.log(window.subtextApp.nvcReference);
```

### Test Explanation Display
```javascript
window.subtextApp.showExplanation('observation');
```

### Test Reference Guide
```javascript
window.subtextApp.showReference();
```

### Check Modal State
```javascript
console.log(document.getElementById('explanationModal').style.display);
console.log(document.getElementById('referenceModal').style.display);
```

### Test Search
```javascript
window.subtextApp.filterFeelings('happy');
window.subtextApp.filterNeeds('connection');
```

---

## Performance Notes

- Reference database: ~15KB (negligible)
- First load: ~0ms (data is hardcoded)
- Search: <1ms (instant filtering)
- Modal open/close: <100ms (CSS animations)
- No network requests needed

---

## Browser DevTools

### Check Styles
Chrome DevTools → Inspector → Select element → Styles tab

### Check Console
Chrome DevTools → Console → Type commands:
```javascript
window.subtextApp.nvcReference.searchFeelings('sad')
window.subtextApp.showExplanation('need')
window.subtextApp.filterNeeds('autonomy')
```

### Check Elements
Chrome DevTools → Elements → Search for:
- `explanationModal` - Find explanation modal
- `referenceModal` - Find reference modal
- `explanation-btn` - Find all explanation buttons

---

## Related Files

- **Audio Processing:** `audio.js`
- **Analysis:** `analysis.js`
- **NVC Logic:** `nvc.js`
- **Pipeline:** `pipeline.js`
- **Translation:** `translation.js`
- **Main App:** `app.js`
- **Reference:** `reference.js` (NEW)
- **Styling:** `style.css`
- **HTML:** `index.html`

---

## Further Reading

For more information, see:
- `FEATURES_GUIDE.md` - User-facing documentation
- `IMPLEMENTATION_COMPLETE.md` - Full implementation details
- Code comments in source files
- Inline JSDoc documentation

---

**Last Updated:** March 2026
**Version:** 1.0
**Status:** Production Ready ✅

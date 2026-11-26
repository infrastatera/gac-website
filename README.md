# GAC Door Handles Website

Static website for GAC Door Handles, hosted on GitHub Pages, with content editable in [Pages CMS](https://pagescms.org).

## How it is built

```
gac-website/
├── content/              ← ⭐ ALL EDITABLE CONTENT LIVES HERE
│   ├── site.json         ← hero, about, finishes, contact details, social links, footer
│   └── catalog.json      ← the 6 categories and their products
├── .pages.yml            ← describes the editing forms shown in Pages CMS
├── js/
│   ├── content.js        ← reads content/*.json and fills the pages
│   └── main.js           ← navigation, lightbox, animations
├── css/style.css         ← all styles
├── images/               ← logo, hero, about, categories/, products/<category>/
└── *.html                ← one page per category + home + contact (layout only)
```

**Content is separate from layout.** The HTML pages hold the design. Places to fill are marked with attributes
(`data-text`, `data-href`, `data-src`, `data-render`), and `js/content.js` fills them from the JSON files.
The text already in the HTML is a fallback if the JSON can't load.

## Editing content (no code)

1. Go to <https://app.pagescms.org> and sign in (GitHub, or the email invitation for collaborators).
2. Open **infrastatera/gac-website**.
3. **Products**: add, remove, reorder, or rename products and upload photos, per category.
   **Website text & contact**: hero, about, finishes, phones, addresses, social links.
4. Click **Save**. Pages CMS commits the change, and GitHub Pages publishes it in about 1 minute.

Every save is a Git commit, so any change can be undone from the repo history.

## Adding an editor without a GitHub account

In Pages CMS, open the repo → **Settings → Collaborators** and invite their email address.
They can edit content and photos but can't change `.pages.yml` or invite other people.

## Adding a new category

Categories are fixed in the forms because each has its own page. To add one:
copy a category page (e.g. `knobs.html`), change `window.CATEGORY` and the `data-text` keys,
add the category to `content/catalog.json` and `.pages.yml`, and add links in the nav/footer of every page.

## Testing locally

```
python3 -m http.server 8000
```
Open <http://localhost:8000>. (Opening the HTML file directly won't load the JSON. A local server is needed.)

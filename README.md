# Hangjie Lin — personal website

A static site (HTML, CSS and plain JavaScript). No build step, no CDN and no
Google Fonts, so it loads anywhere, including mainland China.

Live: https://hangjielin.github.io/hangjie_site/

## Page order

1. **Home**: name, portrait and links.
2. About, Research (four lines of work, numbered notes, figure stories).
3. Cut: papers drawn as sediment layers, one per year.
4. Publications (filters, Cite buttons).
5. Cut: the tide floods in over a field photo.
6. Field: maps of places I have been (China, United States, inset globe),
   then fieldwork photos along a sea-to-land transect.
7. Teaching and talks.
8. Cut: the sun sets and the rest of the page turns to evening:
   Off the clock (videos and a time-lapse), News, footer.

## Files

```
index.html              The whole site; every section is commented
404.html                "Lost to erosion" page for missing URLs
research.html etc.      Redirects from the old site's URLs
assets/css/site.css     Styles (light and dark themes, evening palette)
assets/js/site.js       Navigation, publications, cuts, gallery, videos, lightbox
assets/fonts/           Newsreader and Geologica (SIL Open Font Licence), subset
assets/img/             Portrait, research figures, field photos (*-sm.jpg = thumbnails)
assets/video/           Videos (H.264 MP4, no audio) and their posters
files/                  CV (PDF)
.nojekyll               Tells GitHub Pages to serve files as-is
```

## Publish or update on GitHub Pages

Web upload:

1. In the `hangjie_site` repository, delete the old files.
2. **Add file → Upload files**, drag in the *contents* of this folder (not
   the folder itself) and commit.
3. Wait a minute or two. If nothing changes, check **Settings → Pages**:
   *Deploy from a branch*, branch `main`, folder `/ (root)`.

Hidden files such as `.nojekyll` can be skipped by some file pickers; the
site works without it.

Command line:

```bash
git clone https://github.com/hangjielin/hangjie_site.git
cd hangjie_site
git rm -r --quiet .
# copy the contents of this folder here
git add -A
git commit -m "Redesign site"
git push
```

## Preview locally

Run `python3 -m http.server` in this folder and open http://localhost:8000 .
Opening `index.html` directly also works.

## Common edits

All content lives in `index.html`.

- **New paper**: copy an `<li class="pub">` in the right year group. Set
  `data-kind` to `first`, `collab` or `progress`. Filter counts, the
  sediment-layer cut and the Cite button update automatically. For
  unpublished work the Cite year comes from `data-year` on its group.
- **News**: add an `<li>` at the top of the right year in *News*.
- **Research text**: each research line has a `<div class="theme-text">`
  with the prose in `.prose` and optional numbered notes in
  `<aside class="notes">`. Mark a note in the text with
  `<sup class="sn-ref"><a href="#sn-5">5</a></sup>` and add
  `<p class="note" id="sn-5"><span class="sn-num">5</span> ...</p>`.
  Wide screens show notes in a right-hand column; phones show them below.
- **Research figure**: a `<figure class="fig">` with a `figcaption.story`:
  a bold one-line title followed by one or two sentences.
- **Field photo**: save a ~1600 px image and a ~760 px `-sm.jpg` thumbnail
  in `assets/img/field/`, copy a `<figure class="photo">` in the right zone
  and set `--ar` to width ÷ height. Rows re-balance themselves.
- **Video**: H.264 MP4 without audio keeps files small, e.g.
  `ffmpeg -i in.mov -an -vf scale=720:-2 -c:v libx264 -crf 26 -movflags +faststart out.mp4`.
- **CV**: replace `files/Hangjie_Lin_CV.pdf`, keeping the name.
- **Places map**: static SVG inside `index.html` (search for
  `class="footprint"`), generated once with d3-geo from Natural Earth and
  us-atlas. It shows places I have been, not only fieldwork sites. Small
  edits (a label, a dot) can be made directly in the SVG; names also appear
  in the lists under the maps.

## If the repository is renamed

Update `/hangjie_site/` in `404.html` (four places), the URLs in the
`<head>` of `index.html` (canonical, Open Graph, JSON-LD), and the
"Cite this website" reference in the footer.

## Credits

Map data: Natural Earth (public domain) via world-atlas; US states:
us-atlas. Maps were projected with d3-geo at build time. Fonts: Newsreader (Production Type),
Geologica (Monokrom).

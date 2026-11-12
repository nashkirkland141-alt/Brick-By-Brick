# Brick-By-Brick
BRICKYARD WEBSITE
=================

FILES
- index.html: website structure
- style.css: layout and visual design
- app.js: interactive 3D scene and donation demo

HOW TO RUN
1. Extract the ZIP.
2. Open the A folder.
3. Run a local web server from inside A (recommended), for example:
     python -m http.server 8000
4. Open http://localhost:8000 in your browser.

The 3D brick is generated from actual Three.js geometry (a beveled solid extrusion).
It is not an image. Drag directly on the brick to move it. Drag empty space to orbit
the camera. Use the buttons to rotate and tilt; scroll/pinch to zoom.

INTERNET
Three.js and the fonts are loaded from public CDNs, so an internet connection is
needed when the page loads.

DONATIONS
The donation UI validates amounts from $1 to $500, but is DEMO ONLY. It does not
charge money. To accept real donations, connect a payment provider such as Stripe:
create a server endpoint that creates a Stripe Checkout Session, then redirect the
visitor to that session. Never put secret payment keys in app.js or index.html.

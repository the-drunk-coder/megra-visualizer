# Mégra Visualizer

A simple, browser-based visualizer for the Mégra language.

## Requirements 

You need `node.js` and `npm` installed on your system to run this (and a browser, of course).

For OS-independent instructions, see: https://nodejs.org/en/download

On Linux, you can also use your distribution's package manager. 

The version of `node` and `npm` doesn't really matter, any half-recent version will do.

## Build 

Download this repository (or use `git clone` from the command line) and place it in a convenient location.

To build, navigate to the base folder (the folder that contains `megra_visualizer.js`) and run `npm install`. 

Then, go to the `web` subfolder (`cd web`) and run `npm install` again.

You can also use a single shorthand command from the base folder: `npm i && cd web && npm i`.

## Run

Now, in the base folder, you can start the app using `node megra_visualizer.js`.

Open a browser and go to `http://localhost:8081`.

In the Mégra editor, you need to call `(connect-visualizer)` to connect.

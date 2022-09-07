'use strict'

import App from "./app.js"
import {
    loadSceneFile
}
from "./utils.js"

/**
 * Entry point to the application
 */
function main() {

    // load scene file
    let scene = loadSceneFile("../scenes/single.json")
    console.log(scene)
    console.log(scene.scene.children)

    // start app
    const app = new App(scene)
    app.start()

}

// run the application
main()
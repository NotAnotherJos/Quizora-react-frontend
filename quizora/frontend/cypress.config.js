import { defineConfig } from "cypress";
import { Component } from "react";
 
export default defineConfig({
    e2e:{
        bseUrl:"http://localhost:3000",
    },
    Component:{
        devServer: {
            framework:"react",
            bundler: "vite",
        },
        viewportWidth: 1280,
        viewportHeight: 720,
    },
});



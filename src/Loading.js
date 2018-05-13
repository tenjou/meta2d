import Engine from "./Engine"
import Resources from "./resources/Resources"

const loadingHolder = document.createElement("div")
loadingHolder.style.cssText = "position:absolute; display:flex; width:100%; height:100%; background:black; align-items:center; justify-content: center;"

const progressBar = document.createElement("div")
progressBar.style.cssText = "width:25%; max-width: 120px; height:4px; background:#333;"
loadingHolder.appendChild(progressBar)

const progressBarCurrent = document.createElement("div")
progressBarCurrent.style.cssText = "width:0%; height:100%; background:white;"
progressBar.appendChild(progressBarCurrent)

Resources.on("loading", () => {
	Engine.container.appendChild(loadingHolder)
})

Resources.on("progress", (percents) => {
	progressBarCurrent.style.width = `${percents}%`
})

Resources.on("ready", () => {
	Engine.container.removeChild(loadingHolder)
})

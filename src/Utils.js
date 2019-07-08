
const isPowerOf2 = (value) => {
	return (value & (value - 1)) == 0
}

const onDomLoad = (func) => {
	if((document.readyState === "interactive" || document.readyState === "complete")) {
		func()
		return
	}

	const callbackFunc = (event) => {
		func()
		window.removeEventListener("DOMContentLoaded", callbackFunc)
	}

	window.addEventListener("DOMContentLoaded", callbackFunc)
}

const getRootPath = (path) => {
	const index = path.lastIndexOf("/")
	const rootPath = path.slice(0, index + 1)
	return rootPath
}

const getExt = (path) => {
	const index = path.lastIndexOf(".")
	const ext = path.slice(index + 1)
	return ext
}

export {
	isPowerOf2,
	onDomLoad,
	getRootPath,
	getExt
}
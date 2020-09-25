
export const isPowerOf2 = (value: number) => {
    return (value & (value - 1)) == 0
}

export const onDomLoad = (callback: () => void) => {
    if((document.readyState === "interactive" || document.readyState === "complete")) {
        callback()
        return
    }
    const callbackFunc = (event:Event) => {
        callback()
        window.removeEventListener("DOMContentLoaded", callbackFunc)
    }
    window.addEventListener("DOMContentLoaded", callbackFunc)
}

export const getRootPath = (path: string) => {
    const index = path.lastIndexOf("/")
    const rootPath = path.slice(0, index + 1)
    return rootPath
}

export const getExt = (path: string) => {
    const index = path.lastIndexOf(".")
    const ext = path.slice(index + 1)
    return ext
}

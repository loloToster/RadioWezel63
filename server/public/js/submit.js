let searchInput = document.getElementById("searchInput")

document.getElementById("searchIcon").addEventListener("click", onSearch)
searchInput.addEventListener("keypress",
    event => event.key == "Enter" ? onSearch() : null)

async function onVideoClick(hash) {
    document.getElementById("submitionSuccess").style.display = "flex"
    let res = await fetch("/submit/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: hash
    })

    if (res.status == 403) {
        window.location.href = "/"
        return
    }

    let data = await res.json()
    document.getElementById("loading-response").style.display = "none"
    let sucThumbnail = document.getElementById("successThumbnail")
    sucThumbnail.style.display = "flex"
    sucThumbnail.style.backgroundImage = `url(${data.thumbnail})`
    document.querySelector("#submitionSuccess #tick").classList.add("tickAnimation")
    setTimeout(() => window.location.href = "/", 730)
}

let searching = false

function onSearch() {
    let query = searchInput.value
    if (!query || searching) return

    searching = true
    document.getElementById("resultContainer").innerHTML = ""
    document.getElementById("loading-results").style.display = "block"

    window.location.search = `?q=${encodeURIComponent(query)}`
}

for (const el of document.getElementsByClassName("video")) {
    if (!el.getElementsByClassName("unclickable").length)
        el.addEventListener("click", () => onVideoClick(el.dataset.hash))
}

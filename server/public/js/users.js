function removeAllEventListeners(el) {
    let newEl = el.cloneNode(true)
    el.parentNode.replaceChild(newEl, el)
    return newEl
}

async function onBtnClick(decision, element) {
    const userId = encodeURIComponent(element.querySelector(".dbId").innerText.trim())
    console.log(decision, userId)
    removeAllEventListeners(element)
    let res = await fetch(`/admin/users/${decision}/${userId}`, { method: "PUT" })
    if (res.status != 200) {
        console.log("err")
        window.location.reload()
        return
    }
    console.log(await res.json())
    window.location.reload()
}

function handleUserElements() {
    let users = document.getElementsByClassName("user")
    if (!users) return
    let lastUser = users[0]
    for (const user of users) {
        let promoteBtn = user.querySelector(".promoteBtn")
        let depromoteBtn = user.querySelector(".depromoteBtn")

        if (promoteBtn)
            promoteBtn.addEventListener("click",
                () => onBtnClick("promote", user))

        if (depromoteBtn)
            depromoteBtn.addEventListener("click",
                () => onBtnClick("depromote", user))

        user.addEventListener("click", () => {
            lastUser.classList.remove("active")
            user.classList.add("active")
            lastUser = user
        })
    }
}

let searchInput = document.getElementById("searchInput")

document.querySelector("#searchBar img")
    .addEventListener("click", onSearch)
searchInput.addEventListener("keypress",
    event => event.key == "Enter" ? onSearch() : null
)

function onSearch() {
    let query = searchInput.value
    let by = document.querySelector("input[name='searchBy']:checked")
        .dataset.method
    if (!query || !by) {
        window.location.search = ""
        window.location.replace("/admin/users")
        return
    }
    window.location.search = `?by=${encodeURIComponent(by)}&query=${encodeURIComponent(query)}`
}

handleUserElements()

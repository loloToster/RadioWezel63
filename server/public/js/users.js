function removeAllEventListeners(el) {
    let newEl = el.cloneNode(true)
    el.parentNode.replaceChild(newEl, el)
    return newEl
}

async function onBtnClick(decision, element) {
    const userId = encodeURIComponent(element.querySelector(".dbId").innerText.trim())
    let manage = element.querySelector(".manage")
    let roleElement = element.querySelector(".role")
    roleElement.innerText = "⌛ Wczytuję..."

    manage = removeAllEventListeners(manage)

    let res = await fetch(`/admin/users/${decision}/${userId}`, { method: "PUT" })
    if (res.status != 200) {
        removeAllEventListeners(document.getElementById("userContainer"))
        document.getElementById("error").classList.add("active")
        setTimeout(() => window.location.reload(), 2000)
        return
    }

    let promoteBtn = element.querySelector(".promoteBtn")
    let depromoteBtn = element.querySelector(".depromoteBtn")

    const { newRole, promotable, depromotable } = await res.json()
    roleElement.innerText = newRole.badge + " " + newRole.name

    promotable ? manage.classList.add("promote") : manage.classList.remove("promote")
    depromotable ? manage.classList.add("depromote") : manage.classList.remove("depromote")

    promoteBtn.addEventListener("click",
        () => onBtnClick("promote", element))

    depromoteBtn.addEventListener("click",
        () => onBtnClick("depromote", element))
}

function handleUserElements() {
    let users = document.getElementsByClassName("user")
    if (!users) return
    for (const user of users) {
        let promoteBtn = user.querySelector(".promoteBtn")
        let depromoteBtn = user.querySelector(".depromoteBtn")

        promoteBtn.addEventListener("click",
            () => onBtnClick("promote", user))

        depromoteBtn.addEventListener("click",
            () => onBtnClick("depromote", user))

        user.addEventListener("click", () => {
            for (const activeEl of document.querySelectorAll(".user.active")) {
                activeEl.classList.remove("active")
            }
            user.classList.add("active")
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

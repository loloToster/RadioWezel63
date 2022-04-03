let arrays = document.getElementsByClassName("stringArray")

for (const arr of arrays) {
    const btn = arr.querySelector(".addEl")

    btn.addEventListener("click", () => {
        let newEl = document.createElement("div")

        newEl.classList.add("saEl")
        newEl.innerText = "Nowy element"
        newEl.setAttribute("contenteditable", "")

        arr.insertBefore(newEl, btn)
    })
}

let saveBtn = document.getElementById("saveBtn")

let loading = false
saveBtn.addEventListener("click", () => {
    if (loading) return
    loading = true

    const checkboxes = document.querySelectorAll("input[type=checkbox]")

    let newSettings = {}

    for (const checkbox of checkboxes) {
        newSettings[checkbox.id] = checkbox.checked
    }

    for (const arr of arrays) {
        let newArr = []

        for (const el of arr.getElementsByClassName("saEl")) {
            if (!el.innerText.trim()) continue
            newArr.push(el.innerText)
        }

        newSettings[arr.id] = newArr
    }

    fetch("/admin/settings/save", {
        body: JSON.stringify(newSettings),
        headers: {
            "Content-type": "application/json"
        },
        method: "PUT"
    })

    window.location.href = "/"
})

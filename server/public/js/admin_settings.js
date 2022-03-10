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

    fetch("/admin/settings/save", {
        body: JSON.stringify(newSettings),
        headers: {
            "Content-type": "application/json"
        },
        method: "PUT"
    })

    window.location.href = "/"
})

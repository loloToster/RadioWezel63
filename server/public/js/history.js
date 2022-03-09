const checkboxes = document.querySelectorAll("input[type=checkbox]")
const reviveBtn = document.getElementById("reviveBtn")

for (let checkbox of checkboxes) {
    checkbox.addEventListener("input", () => {
        let anyIsChecked = Array.from(checkboxes).some(x => x.checked)
        reviveBtn.classList.toggle("active", anyIsChecked)
    })
}

let loading = false
reviveBtn.addEventListener("click", async () => {
    if (loading) return
    loading = true

    let ids = Array.from(checkboxes).reduce((acc, cur) => {
        if (cur.checked) acc.push(cur.id)
        return acc
    }, [])

    reviveBtn.classList.add("loading")

    await fetch("/admin/history/revive", {
        body: JSON.stringify(ids),
        headers: {
            "Content-type": "application/json"
        },
        method: "PUT"
    })

    window.location.reload()
})

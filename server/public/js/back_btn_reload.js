// reload if page was accessed through back button
window.addEventListener("pageshow", e => {
    let historyTraversal = e.persisted ||
        (typeof window.performance != "undefined" &&
            window.performance.navigation.type === 2)
    if (historyTraversal) window.location.reload()
})

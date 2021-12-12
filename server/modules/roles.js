const roles = [
    {
        name: "user",
        level: 0,
        badge: "👤"
    },
    {
        name: "moderator",
        level: 1,
        badge: "🎖️"
    },
    {
        name: "admin",
        level: 2,
        badge: "👑"
    },
    {
        name: "developer",
        level: Infinity,
        badge: "👨‍💻"
    }
]

Object.defineProperty(roles, "getRoleByLevel", {
    value: function (level) { return this.find(role => role.level === level) }
})

Object.defineProperty(roles, "_getRoleIndex", {
    value: function (role) {
        return this.findIndex(
            r => r.name === role.name &&
                r.level === role.level &&
                r.badge === role.badge)
    }
})

Object.defineProperty(roles, "getNextRole", {
    value: function (role) {
        return this[
            this._getRoleIndex(role) + 1
        ]
    }
})

Object.defineProperty(roles, "getPrevRole", {
    value: function (role) {
        return this[
            this._getRoleIndex(role) - 1
        ]
    }
})

module.exports = roles


let id = 0

const getId = () => {
    id++
    return {
        id: id,
        name: `用户${id}`
    }
}

module.exports = getId
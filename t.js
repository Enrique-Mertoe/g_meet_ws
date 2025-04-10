const validateInput = (...args) => {
    for (let arg in args)
        if (!args[arg])
            return false
    return true;
}

console.log( Object.values("sss").every(value => typeof value === 'string'))
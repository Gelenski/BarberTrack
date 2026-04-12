function isAuthenticated(req, res, next){
    if (req.session && req.session.user){
        return next();
    }
    return res.redirect("/auth/login")
}

function isBarbearia(req, res, next){
    if (req.session.user.tipo === "barbearia"){
        return next();
    }

    return res.status(403).send("Acesso negado")
}

function isCliente(req, res, next){
    if (req.session.user.tipo === "cliente"){
        return next();
    }

    return res.status(403).send("Acesso negado")
}

module.exports = { isAuthenticated, isBarbearia, isCliente };
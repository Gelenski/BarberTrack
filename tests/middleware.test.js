const {
  isAuthenticated,
  isBarbearia,
  isCliente,
} = require("../middleware/auth");
const responseMessages = require("../utils/responseMessages");

function createResponseDouble() {
  return {
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
}

describe("Middlewares de autenticacao", () => {
  it("redireciona quando nao ha sessao autenticada", () => {
    const req = { session: {} };
    const res = createResponseDouble();
    const next = jest.fn();

    isAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith("/auth/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("permite acesso quando usuario cliente esta autenticado", () => {
    const req = { session: { user: { tipo: "cliente" } } };
    const res = createResponseDouble();
    const next = jest.fn();

    isCliente(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("bloqueia acesso quando o perfil do usuario nao corresponde", () => {
    const req = { session: { user: { tipo: "cliente" } } };
    const res = createResponseDouble();
    const next = jest.fn();

    isBarbearia(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(responseMessages.accessDenied);
    expect(next).not.toHaveBeenCalled();
  });
});

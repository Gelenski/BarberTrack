const { normalizeCnpj, normalizeTelefone } = require("../utils/normalizers");
const { validateClientePayload } = require("../validators/cliente");
const { validateBarbeariaPayload } = require("../validators/barbearia");
const { resolveAuthProfile } = require("../utils/authProfile");
const responseMessages = require("../utils/responseMessages");

describe("Helpers e validators", () => {
  describe("normalizers", () => {
    it("normaliza cnpj removendo caracteres nao numericos", () => {
      expect(normalizeCnpj("12.345.678/0001-90")).toBe("12345678000190");
    });

    it("normaliza telefone removendo caracteres nao numericos", () => {
      expect(normalizeTelefone("(41) 99999-9999")).toBe("41999999999");
    });
  });

  describe("validateClientePayload", () => {
    it("retorna erro quando faltam campos obrigatorios", () => {
      expect(
        validateClientePayload({
          nome: "Lucas",
          sobrenome: "",
          email: "lucas@email.com",
          telefone: "41999999999",
          senha: "12345678",
        })
      ).toBe(responseMessages.requiredClienteFields);
    });

    it("retorna null quando payload e valido", () => {
      expect(
        validateClientePayload({
          nome: "Lucas",
          sobrenome: "Silva",
          email: "lucas@email.com",
          telefone: "41999999999",
          senha: "12345678",
        })
      ).toBeNull();
    });
  });

  describe("validateBarbeariaPayload", () => {
    it("retorna erro para payload obrigatorio ausente", () => {
      expect(
        validateBarbeariaPayload({
          nomeFantasia: "",
          razaoSocial: "Barber Prime LTDA",
          cnpj: "12.345.678/0001-90",
          telefone: "41999999999",
          senha: "12345678",
        })
      ).toBe(responseMessages.invalidBarbeariaFields);
    });

    it("retorna erro para cnpj invalido", () => {
      expect(
        validateBarbeariaPayload({
          nomeFantasia: "Barber Prime",
          razaoSocial: "Barber Prime LTDA",
          cnpj: "123",
          telefone: "41999999999",
          senha: "12345678",
        })
      ).toBe(responseMessages.invalidCnpj);
    });

    it("retorna erro para telefone invalido", () => {
      expect(
        validateBarbeariaPayload({
          nomeFantasia: "Barber Prime",
          razaoSocial: "Barber Prime LTDA",
          cnpj: "12.345.678/0001-90",
          telefone: "123",
          senha: "12345678",
        })
      ).toBe(responseMessages.invalidTelefone);
    });

    it("retorna null quando payload e valido", () => {
      expect(
        validateBarbeariaPayload({
          nomeFantasia: "Barber Prime",
          razaoSocial: "Barber Prime LTDA",
          cnpj: "12.345.678/0001-90",
          telefone: "41999999999",
          senha: "12345678",
        })
      ).toBeNull();
    });
  });

  describe("resolveAuthProfile", () => {
    it("retorna o perfil de barbearia quando informado", () => {
      expect(resolveAuthProfile("barbearia")).toMatchObject({
        tipo: "barbearia",
        tabela: "barbearia",
        campoNome: "nome_fantasia",
        redirectPath: "/barbearia/dashboard",
      });
    });

    it("usa cliente como default", () => {
      expect(resolveAuthProfile("qualquer-coisa")).toMatchObject({
        tipo: "cliente",
        tabela: "cliente",
        campoNome: "nome",
        redirectPath: "/cliente/dashboard",
      });
    });
  });
});

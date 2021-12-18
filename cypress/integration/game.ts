describe("game", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("should start correctly", () => {
    cy.contains("New game").click()
    cy.get(".move-dest").last().realClick()
  })

  it("makes move correctly", () => {})
})

describe("game", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("initializes with empty state", () => {
    cy.clock()
    cy.tick(5000)
    cy.contains("00:00").should("exist")
    cy.contains("Next square to visit").next().should("contain", "-")
    cy.contains("Moves").next().should("contain", "0")
    cy.contains("Squares left").next().should("contain", "35")
  })

  it("updates timer and next square indicator on start", () => {
    cy.clock()
    cy.contains("New game").click()
    cy.tick(5000)
    cy.contains("f8").should("be.visible")
    cy.contains("00:05").should("exist")
  })

  it("updates move count when knight moves to new square", () => {
    cy.contains("New game").click()
    cy.get(".move-dest")
      .eq(1) // h8 -> g6
      .realClick()
      .then(() => {
        cy.contains("Moves").next().should("contain", "1")
      })
  })

  it("shows an error when knight moves to queen-attacked square", () => {
    cy.contains("End game if knight moves").click()
    cy.contains("New game").click()
    cy.get(".move-dest")
      .eq(0) // h8 -> f7
      .realClick()
      .then(() => {
        cy.contains("Oops, game over").should("exist")
        cy.contains("Moves").next().should("contain", "1")
      })
  })
})

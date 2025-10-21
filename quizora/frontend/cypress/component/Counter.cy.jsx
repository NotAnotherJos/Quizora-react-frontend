/* eslint-disable no-undef */
import Counter from "../../src/components/counter/index.jsx";

/**
 * Counter Component Test
 */
describe('Counter Component Test', () => {
  // render test
  it('should mount', () => {
    // load the component
    cy.mount(<Counter />);
    cy.get('button').contains('+1');
    cy.get('button').contains('-1');
    cy.get('span.count-text').should('have.text', 'You clicked 0 times.');
  });

  // logic
  it('when counter button is clicked, should call onClick', () => {
    cy.mount(<Counter />);
    cy.get('button').contains('+1').click();
    cy.get('span.count-text').should('have.text', 'You clicked 1 times.');
    cy.get('button').contains('+1').click();
    cy.get('span.count-text').should('have.text', 'You clicked 2 times.');
    cy.get('button').contains('-1').click();
    cy.get('span.count-text').should('have.text', 'You clicked 1 times.');
    cy.get('button').contains('-1').click();
    cy.get('span.count-text').should('have.text', 'You clicked 0 times.');
    cy.get('button').contains('-1').click();
    cy.get('span.count-text').should('have.text', 'You clicked 0 times.');
    cy.get('.ant-message').should('have.text', 'can\'t decrease count~');
  });
});


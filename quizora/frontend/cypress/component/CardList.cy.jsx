/* eslint-disable no-undef */
import { BrowserRouter } from 'react-router'; // correct the path
import CardList from '../../src/components/card-list';

/**
 *   CardList test
 */
describe('Test CardList Component', () => {
  // use fixture to simulate
  beforeEach(function() {
    cy.fixture('games.json').then((gamesData) => {
      this.games = gamesData;
      console.log('Loaded games data:', this.games);
    });
    // use email message in it
    localStorage.setItem('email', 'Hello123@example.com');
  });

  //render test
  it('renders a list of slides', function() {
    console.log('Games data in test:', this.games);
    // Make sure this.games is defined before mounting the component
    cy.wrap(this.games).should('not.be.undefined').then(() => {
      cy.mount(
        <BrowserRouter initialEntries={['/dashboard']}>
          <CardList 
            games={this.games} 
            calculateTotalDuration={() => '10 mins'} // add must-need prop
            onStartGame={() => {}}
            onStopGame={() => {}}
            onDeleteGame={() => {}}
          />
        </BrowserRouter>
      );

      // Check that the slides are rendered
      cy.get('.ant-card').should('have.length', this.games.length);

      // Verify the content of the first slide
      cy.get('.ant-card').eq(0).within(() => {
        cy.get('.ant-card-meta-title').should('have.text', 'question1');
        cy.contains('Num of questions:');
      });

      // Verify the content of the second slide
      cy.get('.ant-card').eq(1).within(() => {
        cy.contains('question2');
      });

      // jump test
      cy.get('.ant-card').eq(0).within(() => {
        cy.get('.anticon-edit').click();
        //  jump to the specified edit page
        cy.url().should('include', `/game/${this.games[0].id}`);
      });
    });
  });
});

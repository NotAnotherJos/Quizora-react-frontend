/* eslint-disable no-undef */

const DEFAULT_THUMBNAIL = 'https://img.freepik.com/free-vector/gradient-software-development_23-2 148819604.jpg';

const getRandomEmail = () => {
  const timestamp = new Date().getTime();
  return `test_user_${timestamp}@example.com`;
};

const TEST_USER = {
  name: 'Test User',
  email: getRandomEmail(),
  password: 'password123',
};

const TEST_GAME = {
  name: 'TEST_GAME',
  description: 'A game that use automatical test to create',
  thumbnail: DEFAULT_THUMBNAIL,
};

describe('Auth Login UI Test', () => {
  // Before each test we need to restore local storage to preserve it.
  beforeEach(() => {
    cy.restoreLocalStorage();
  });
  // After each test we save local storage.
  afterEach(() => {
    cy.saveLocalStorage();
  });

  it('Auth Login UI Test', () => {
    // login page
    cy.visit('localhost:5005/login');
    cy.url().should('include', 'localhost:5005/login');
    
    // verify elements in sign in page
    cy.contains('Login').should('be.visible');
    
    // drup to register page
    cy.contains('Register').click();
    cy.url().should('include', '/register');
    
    // sign up
    cy.get('input[id="name"]').type(TEST_USER.name);
    cy.get('input[id="email"]').type(TEST_USER.email);
    cy.get('input[id="password"]').type(TEST_USER.password);
    cy.get('input[id="confirmPassword"]').type(TEST_USER.password);
    cy.contains('button', 'Register').click();
    
    // jump to dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.contains('Quizora').should('be.visible');
    
    // create game
    cy.contains('create game').click();
    cy.get('.ant-modal-content').should('be.visible');
    
    // fill game information
    cy.get('input[id="name"]').type(TEST_GAME.name);
    cy.get('textarea[id="description"]').type(TEST_GAME.description);
    
    //  submit create-game 
    cy.get('button[id="create-game"]').click();
    
    // verify game created successfully
    cy.contains('game created successfully').should('be.visible');
    cy.contains(TEST_GAME.name).should('be.visible');
    
    // start game
    cy.contains(TEST_GAME.name)
      .parents('.ant-card')
      .within(() => {
        cy.contains('start game').click();
      });
    
    // verify game start
    cy.contains('game already started').should('be.visible');

    cy.get('a[id="session-link"]').click();
    cy.url().should('include', '/play/');
    // return to home page to check status
    cy.go('back');
    cy.url().should('include', '/dashboard');
    
    // Verify game state already updated
    cy.contains(TEST_GAME.name)
      .parents('.ant-card')
      .within(() => {
        cy.contains('conversation doing').should('be.visible');
        cy.contains('Stop game').should('be.visible');
      });

    // Game end
    cy.contains(TEST_GAME.name)
      .parents('.ant-card')
      .within(() => {
        cy.contains('Stop game').click();
      });
    
    // verify game end successfully
    cy.contains('Game already stopped').should('be.visible');
    
    //check result page
    cy.contains('check result').click();
    cy.url().should('include', '/session/');
    
    //return to Dashboard
    cy.go('back');
    cy.url().should('include', '/dashboard');
    
    // log out
    cy.get('button[id="logout-button"]').click();
    cy.contains('Logout Success~').should('be.visible');
    cy.url().should('include', '/login');
    
    // login again
    cy.get('input[id="email"]').type(TEST_USER.email);
    cy.get('input[id="password"]').type(TEST_USER.password);
    cy.contains('button', 'Login').click();
    // varify sign in successfully
    cy.url().should('include', '/dashboard');
    // verify the created game still exist
    cy.contains(TEST_GAME.name).should('be.visible');
  });
});

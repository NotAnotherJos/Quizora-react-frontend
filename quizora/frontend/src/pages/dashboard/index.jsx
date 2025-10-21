import React, { useEffect, useState } from 'react';
import { get, post, put } from '../../utils/request';
import { 
  Card, message, Typography, Layout, Menu, Empty, Button, Modal, Space, 
  Input, Avatar, Popconfirm, Tooltip, notification, Badge, Progress,
  Steps, Drawer
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  DeleteOutlined, 
  EditOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  LinkOutlined,
  StopOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { isLogin } from '../../utils/index';
const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;
const { Step } = Steps;

function Dashboard() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [gameName, setGameName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [currentGame, setCurrentGame] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [gameUrl, setGameUrl] = useState('');
    const [sessionStatus, setSessionStatus] = useState({});
    const [sessionDrawerVisible, setSessionDrawerVisible] = useState(false);
    const [activeSessionGame, setActiveSessionGame] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const viewSessionDetails = (game) => {
      setActiveSessionGame(game);
      setActiveSessionId(game.sessionId);
      
      // 获取当前问题索引
      if (sessionStatus[game.sessionId] && sessionStatus[game.sessionId].currentQuestion !== undefined) {
        setCurrentQuestionIndex(sessionStatus[game.sessionId].currentQuestion);
      } else {
        setCurrentQuestionIndex(-1); // 未开始任何问题
      }
      
      setSessionDrawerVisible(true);
    };
    
    const closeSessionDrawer = () => {
      setSessionDrawerVisible(false);
      setActiveSessionGame(null);
      setActiveSessionId(null);
    };

    const startFirstQuestion = () => {
      if (!activeSessionGame || !activeSessionId) return;
      
      post(`/admin/game/${activeSessionGame.id}/mutate`, {
        mutationType: "ADVANCE"
      })
        .then(res => {
          if (res) {
            message.success('Advanced to first question');
            setCurrentQuestionIndex(0);
            
            // 更新会话状态
            getSessionStatus(activeSessionId);
          }
        })
        .catch(error => {
          console.error('Failed to advance to first question:', error);
          message.error('Failed to advance to first question');
        });
    };
    
    const advanceToNextQuestion = () => {
      if (!activeSessionGame || !activeSessionId) return;
      
      post(`/admin/game/${activeSessionGame.id}/mutate`, {
        mutationType: "ADVANCE"
      })
        .then(res => {
          if (res) {
            const nextIndex = currentQuestionIndex + 1;
            message.success(`Advanced to question ${nextIndex + 1}`);
            setCurrentQuestionIndex(nextIndex);
            
            // 更新会话状态
            getSessionStatus(activeSessionId);
          }
        })
        .catch(error => {
          console.error('Failed to advance question:', error);
          message.error('Failed to advance to next question');
        });
    };
    
    const endSessionFromDrawer = () => {
      if (!activeSessionGame) return;
      Modal.confirm({
        title: 'End Game Session',
        content: 'Are you sure you want to end this game session? All players will be sent to the results screen.',
        okText: 'Yes',
        cancelText: 'No',
        onOk: () => {
          post(`/admin/game/${activeSessionGame.id}/mutate`, {
            mutationType: "END"
          })
            .then(res => {
              if (res) {
                const updatedGames = games.map(g => {
                  if (g.id === activeSessionGame.id) {
                    return {
                      ...g,
                      active: false,
                      sessionId: g.sessionId
                    };
                  }
                  return g;
                });
                setGames(updatedGames);
                setSessionStatus(prevStatus => {
                  const newStatus = {...prevStatus};
                  if (newStatus[activeSessionId]) {
                    newStatus[activeSessionId] = {
                      ...newStatus[activeSessionId],
                      status: "finished"
                    };
                  }
                  return newStatus;
                });
                message.success('Game session ended!');
                Modal.confirm({
                  title: 'Session has been stopped',
                  content: 'Do you want to see the results?',
                  okText: 'Yes',
                  cancelText: 'No',
                  onOk: () => {
                    closeSessionDrawer();
                    navigate(`/session/${activeSessionId}`);
                  },
                  onCancel: () => {
                    closeSessionDrawer();
                  }
                });
              }
            })
            .catch(error => {
              console.error('Failed to end game session:', error);
              message.error('Failed to end game session');
            });
        }
      });
    };

    const logout = () => {
        post('/admin/auth/logout')
          .then((res) => {
              if(res){
                  message.success('logout success');
                  localStorage.removeItem('token');
                  navigate('/login');
              }
          })
          .catch(() => {
            message.error('Logout failed');
          });
    };
    
    // load game list
    const loadGames = () => {
      console.log('运行 loadGames function');
      get('/admin/games').then((res) => {
        console.log('response from /admin/games:', res);
        if (res && Array.isArray(res.games)) {
          setGames(res.games);
          
          // 检查所有活跃会话的状态
          res.games.forEach(game => {
            if (game.active && game.sessionId) {
              getSessionStatus(game.sessionId);
            }
          });
        } else {
          message.error('Failed to load games');
        }
      }).catch(err => {
        console.error('loadGames error:', err);
        message.error('Error loading games');
      });
    };
    const getSessionStatus = (sessionId) => {
      get(`/admin/session/${sessionId}/status`)
        .then(res => {
          if (res && res.data) {
            console.log(`Session ${sessionId} status:`, res.data);
            setSessionStatus(prevStatus => ({
              ...prevStatus,
              [sessionId]: res.data
            }));
            if (res.data.status === "inactive") {
              const updatedGames = games.map(g => {
                if (g.sessionId === sessionId) {
                  return {
                    ...g,
                    active: false
                  };
                }
                return g;
              });
              setGames(updatedGames);
            }
          }
        })
        .catch(error => {
          console.error(`Failed to get status for session ${sessionId}:`, error);
        });
    };
    useEffect(() => {
      const statusInterval = setInterval(() => {
        games.forEach(game => {
          if (game.active && game.sessionId) {
            getSessionStatus(game.sessionId);
          }
        });
      }, 10000);
      return () => clearInterval(statusInterval);
    }, [games]);

    useEffect(() => {
        // check status
        const logined = isLogin();
        if (!logined) {
          message.warning('Not logged in');
          navigate('/login');
        } else {
          loadGames();
        }
    }, []);

    //  create game pop-up
    const showModal = (game = null) => {
        setIsModalOpen(true);
        if (game) {
            setGameName(game.name); 
            setEditId(game.id);     
        } else {
            setGameName('');    //clear input box
            setEditId(null);    //clear edit ID
        }
    };
    
    // close pop-up
    const handleCancel = () => {
        setIsModalOpen(false);
        setGameName('');
        setEditId(null);
    };
    
    // close session pop-up
    const handleSessionCancel = () => {
        setIsSessionModalOpen(false);
        setSessionId('');
        setGameUrl('');
        setCurrentGame(null);
    };
    
    //  create & edit game logic
    const handleCreateGame = () => {
        // check empty name 
        if(!gameName.trim()){
            message.error('Game name is required');
            return;
        }
        let updatedGames;
        const newGame = {
          id: Date.now(),
          name: gameName,
          questions: [],
          owner:localStorage.getItem('email'),
          createdAt: new Date().toISOString(),
        };
        updatedGames = {games:[...games, newGame]};
        console.log(updatedGames);
        message.success('Game created');
      put('/admin/games', updatedGames).then(() => {
        message.success('Game saved');
        loadGames();
        setIsModalOpen(false);
        setGameName('');
        setEditId(null);
      });
    };
    
    
    //  delete game
    const handelDeleteGame = (id) => {
      const newGames = games.filter(game => game.id !== id);
      put('/admin/games', {games:newGames})
        .then(res => {
          if(res){
            message.success('Delete game success!');
            setGames(newGames);
          }
        }).catch(error => {
          console.error('Failed to delete game:', error);
          message.error('Fail to delete game')
        })
    };

    // Start a game session
    const startGameSession = (game) => {
      // Check if any other game is already active
      const activeGameExists = games.some(g => g.active && g.id !== game.id);
      if (activeGameExists) {
        message.error('Another game is already active. Only one game can be active at a time.');
        return;
      }
      // Call the API to start the game
      post(`/admin/game/${game.id}/mutate`, {
        mutationType: "START"
      })
        .then(res => {
          if (res && res.data) {
            // Get the session ID from the data.sessionId field as shown in your API response
            const newSessionId = res.data.sessionId;
            
            if (!newSessionId) {
              message.error('Failed to get session ID from server');
              return;
            }
            // Update local state to reflect the active game
            const updatedGames = games.map(g => {
              if (g.id === game.id) {
                return {
                  ...g,
                  active: true,
                  sessionId: newSessionId
                };
              }
              return g;
            });
            setGames(updatedGames);
            setCurrentGame(game);
            setSessionId(newSessionId);
            const gameUrl = `${window.location.origin}/play?session=${newSessionId}`;
            setGameUrl(gameUrl);
            getSessionStatus(newSessionId);
            setIsSessionModalOpen(true);
            message.success('Game session started!');
          } else {
            message.error('Invalid response from server');
          }
        })
        .catch(error => {
          console.error('Failed to start game session:', error);
          message.error('Failed to start game session');
        });
    };
    
    // End a game session
    const endGameSession = (gameId) => {
      post(`/admin/game/${gameId}/mutate`, {
        mutationType: "END"
      })
        .then(res => {
          if (res) {
            const updatedGames = games.map(g => {
              if (g.id === gameId) {
                return {
                  ...g,
                  active: false,
                  sessionId: g.sessionId
                };
              }
              return g;
            });
            
            setGames(updatedGames);
            const endedGame = games.find(g => g.id === gameId);
            if (endedGame && endedGame.sessionId) {
              const sessionId = endedGame.sessionId;
              setSessionStatus(prevStatus => {
                const newStatus = {...prevStatus};
                if (newStatus[sessionId]) {
                  newStatus[sessionId] = {
                    ...newStatus[sessionId],
                    status: "finished"
                  };
                }
                return newStatus;
              });
              Modal.confirm({
                title: 'Session has been stopped',
                content: 'Do you want to see the outcome？',
                okText: 'Yes',
                cancelText: 'No',
                onOk: () => {
                  navigate(`/session/${sessionId}`);
                }
              });
            }
            message.success('Game session ended!');
          }
        })
        .catch(error => {
          console.error('Failed to end game session:', error);
          message.error('Failed to end game session');
        });
    };
    
    // Copy game session link to clipboard
    const copyToClipboard = () => {
      navigator.clipboard.writeText(gameUrl)
        .then(() => {
          notification.success({
            message: 'Link Copied!',
            description: 'Game session link has been copied to clipboard.',
            placement: 'topRight',
          });
        })
        .catch(err => {
          console.error('Failed to copy to clipboard:', err);
          message.error('Failed to copy link');
        });
    };

    const renderSessionDrawerContent = () => {
      if (!activeSessionGame || !activeSessionId) return null;
      
      const status = sessionStatus[activeSessionId];
      const totalQuestions = activeSessionGame.questions?.length || 0;
      const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < totalQuestions
        ? activeSessionGame.questions[currentQuestionIndex]
        : null;
      
      return (
        <div>
          <Title level={4}>{activeSessionGame.name} - Live Session</Title>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Session ID: </Text>
              <Text copyable>{activeSessionId}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Status: </Text>
              <Text>
                {status?.status === "waiting" ? "Waiting to Start" :
                 status?.status === "active" ? "In Progress" :
                 status?.status === "finished" ? "Finished" : "Unknown"}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Players: </Text>
              <Text>{status?.playerCount || 0}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Progress: </Text>
              <Progress 
                percent={totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0} 
                format={() => `${currentQuestionIndex + 1}/${totalQuestions}`}
                strokeColor="#1890ff"
                status={currentQuestionIndex < 0 ? "exception" : "active"}
              />
            </div>
          </Card>
          <Card title="Question Control" style={{ marginBottom: 24 }}>
            {currentQuestionIndex < 0 ? (
              <div style={{ textAlign: 'center' }}>
                <Text>Game has not started yet. Start the first question when players are ready.</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={startFirstQuestion}
                  >
                    Start First Question
                  </Button>
                </div>
              </div>
            ) : currentQuestionIndex < totalQuestions - 1 ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Current Question: </Text>
                  <Text>{currentQuestion?.content || `Question ${currentQuestionIndex + 1}`}</Text>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Type: </Text>
                  <Text>
                    {currentQuestion?.type === 'single' ? 'Single Choice' :
                     currentQuestion?.type === 'multiple' ? 'Multiple Choice' :
                     currentQuestion?.type === 'judgement' ? 'True/False' : 'Unknown'}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<ArrowRightOutlined />}
                    onClick={advanceToNextQuestion}
                  >
                    Next Question
                  </Button>
                  <Button 
                    danger
                    icon={<StopOutlined />}
                    onClick={endSessionFromDrawer}
                  >
                    End Game
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Text>This is the last question. End the game when all players have answered.</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    danger
                    icon={<StopOutlined />}
                    onClick={endSessionFromDrawer}
                  >
                    End Game
                  </Button>
                </div>
              </div>
            )}
          </Card>
          <Steps 
            direction="vertical" 
            current={currentQuestionIndex >= 0 ? currentQuestionIndex : -1}
            status={currentQuestionIndex < 0 ? "wait" : "process"}
          >
            {activeSessionGame.questions?.map((q, index) => (
              <Step 
                key={index} 
                title={`Question ${index + 1}`} 
                description={q.content} 
                status={
                  index < currentQuestionIndex ? "finish" :
                  index === currentQuestionIndex ? "process" : "wait"
                }
              />
            ))}
          </Steps>
        </div>
      );
    };
    
    return (
        <Layout>
            {/* guide area on top */}
            <Header style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src='/logo.svg' alt="Logo" style={{ height: 40 }} />
                    <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Quizora</span>
                </div>
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']} style={{ flex: 1 }} />

                <Space size={16}>
                <Button type="primary" onClick={() => showModal(null)}>Create Now</Button>
                    <Button type="primary" danger ghost onClick={logout}>
                        Logout
                    </Button>
                </Space>
            </Header>
            {/* content area */}
            <Content style={{ padding: 24}}>
                {games.length === 0 ? (
                    <Empty
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        description={<Typography.Text>No games~</Typography.Text>}
                    >
                    </Empty>
                ) : (
                  <div className="game-card-container" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '24px',
                    justifyContent: 'center',
                    padding: '20px 0'
                  }}>
                    {games.map((game) => (
                      <Card
                      key={game.id}
                      hoverable
                      style={{ 
                        width: 390, 
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease'
                      }}
                      cover={
                        <div style={{ height: 180, overflow: 'hidden', position: 'relative', background: '#f6f8fa' }}>
                          <img 
                            alt={game?.name || "Game image"} 
                            src={game?.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%23f6f8fa'/%3E%3Cpath d='M150 70 C150 70, 180 60, 180 90 C180 120, 120 120, 120 90 C120 60, 150 70, 150 70 Z' fill='%23e1e5ea'/%3E%3Ccircle cx='150' cy='60' r='15' fill='%23e1e5ea'/%3E%3C/svg%3E"} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              transition: 'transform 0.5s ease'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '30px 16px 12px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white'
                          }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                              {game?.name || "Untitled Game"}
                            </div>
                          </div>
                        </div>
                      }
                      actions={[
                        <EditOutlined key="edit" style={{ fontSize: '16px', color: '#1890ff' }} onClick={() => navigate(`/game/${game.id}`)}/>,
                        game.active ? (
                          <Tooltip title="End Game Session">
                            <StopOutlined 
                              key="stop" 
                              style={{ fontSize: '16px', color: '#f5222d' }} 
                              onClick={() => endGameSession(game.id)}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Start Game Session">
                            <PlayCircleOutlined 
                              key="play" 
                              style={{ fontSize: '16px', color: '#52c41a' }} 
                              onClick={() => startGameSession(game)}
                            />
                          </Tooltip>
                        ),
                        <Popconfirm
                          title="Delete the game"
                          description="Are you sure to delete this game?"
                          onConfirm={() => handelDeleteGame(game.id)}
                          onCancel={() => {}}
                          okText="Yes"
                          cancelText="No"
                        >
                        <DeleteOutlined key="delete" style={{ fontSize: '16px', color: '#ff4d4f' }} />
                        </Popconfirm>,
                      ]}
                    >
                      <div style={{ padding: '0 12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '0px',
                          gap: '10px'
                        }}>
                          <Avatar style={{ 
                            backgroundColor: '#1890ff',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '50%',
                            width: '40px',    
                            height: '40px',   
                            minWidth: '40px', 
                            minHeight: '40px',
                            fontSize: '18px' 
                          }}>
                            {game.owner ? game.owner[0].toUpperCase() : 'U'}
                          </Avatar>
                          <div>
                            <div style={{ fontSize: '14px', color: '#666' }}>Created by</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{game?.owner || "Unknown"}</div>
                          </div>
                        </div>
                        
                        <div style={{ color: '#666', fontSize: '14px', minHeight: '42px' }}>
                          {game?.description || "No description available for this game."}
                        </div>
                        <div style={{ 
                          marginTop: '12px', 
                          display: 'flex', 
                          gap: '8px'
                        }}>
                          <div style={{ 
                            fontSize: '12px', 
                            padding: '3px 10px', 
                            borderRadius: '10px', 
                            backgroundColor: '#e6f7ff', 
                            color: '#1890ff' 
                          }}>
                            {game.questions?.length || 0} {game.questions?.length === 1 ? 'Question' : 'Questions'}
                          </div>
                          {game.active && (
                            <div style={{ 
                              fontSize: '12px', 
                              padding: '3px 10px', 
                              borderRadius: '10px', 
                              backgroundColor: '#f6ffed', 
                              color: '#52c41a',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <div style={{ width: '6px', height: '6px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
                              Active Session
                            </div>
                          )}
                        </div>
                        {game.active && game.sessionId && (
                          <div style={{ 
                            marginTop: '12px',
                            padding: '10px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <div>
                                <div style={{ fontSize: '12px', color: '#888' }}>Session ID:</div>
                                <div style={{ fontWeight: 'bold' }}>{game.sessionId}</div>
                              </div>
                              <Tooltip title="Copy Game Link">
                                <Button 
                                  icon={<LinkOutlined />} 
                                  type="text"
                                  onClick={() => {
                                    const url = `${window.location.origin}/play?session=${game.sessionId}`;
                                    navigator.clipboard.writeText(url);
                                    message.success('Game link copied!');
                                  }}
                                />
                              </Tooltip>
                            </div>
                            {sessionStatus[game.sessionId] && (
                              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => viewSessionDetails(game)}
                                  >
                                    Manage Session
                                  </Button>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Badge status="processing" color="#1890ff" />
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <UserOutlined style={{ marginRight: '4px' }} />
                                      <span>{sessionStatus[game.sessionId].playerCount || 0} Players</span>
                                    </div>
                                    
                                    {sessionStatus[game.sessionId].currentQuestion !== undefined && (
                                      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                                        <QuestionCircleOutlined style={{ marginRight: '4px' }} />
                                        <span>Q{sessionStatus[game.sessionId].currentQuestion + 1}/{game.questions?.length}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {sessionStatus[game.sessionId].status && (
                                  <div style={{ 
                                    marginTop: '4px', 
                                    fontStyle: 'italic', 
                                    color: '#888' 
                                  }}>
                                    Status: {sessionStatus[game.sessionId].status}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                    ))}
                  </div>
                )}
            </Content>
            <Modal
              title={'Create Game'}
              open={isModalOpen}
              onOk={handleCreateGame}
              onCancel={handleCancel}
              okText={'Create'}
              cancelText="Cancel"
            >
              <Input
                placeholder="Please enter game name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </Modal>
            <Modal
              title="Game Session Started!"
              open={isSessionModalOpen}
              onCancel={handleSessionCancel}
              footer={[
                <Button key="close" onClick={handleSessionCancel}>
                  Close
                </Button>
              ]}
            >
              <div style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Session ID:</div>
                  <div style={{ 
                    padding: '10px 15px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px', 
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}>
                    {sessionId}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Game URL:</div>
                  <div style={{ 
                    padding: '10px 15px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '350px' 
                    }}>
                      {gameUrl}
                    </div>
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={copyToClipboard}
                      type="primary"
                      size="small"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fffbe6', padding: '10px', borderRadius: '4px' }}>
                  <Text type="warning">
                    Share this URL with players so they can join the game. The session will remain active until you end it.
                  </Text>
                </div>

                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    icon={<EyeOutlined />}
                    onClick={() => {
                      handleSessionCancel();
                      viewSessionDetails(currentGame);
                    }}
                  >
                    Manage Session
                  </Button>
                </div>
              </div>
            </Modal>
            
            <Drawer
              title="Game Session Management"
              placement="right"
              width={500}
              onClose={closeSessionDrawer}
              open={sessionDrawerVisible}
              footer={
                <div style={{ textAlign: 'right' }}>
                  <Button onClick={closeSessionDrawer} style={{ marginRight: 8 }}>
                    Close
                  </Button>
                  {activeSessionGame?.active && (
                    <Button 
                      danger 
                      onClick={endSessionFromDrawer}
                    >
                      End Game
                    </Button>
                  )}
                </div>
              }
            >
              {renderSessionDrawerContent()}
            </Drawer>
        </Layout>
    );
}

export default Dashboard;
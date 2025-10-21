import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, put } from '../../utils/request';
import { 
  Card, message, Typography, Layout, Button, Statistic, Row, Col,
  Space, Divider, Table, Progress, Spin, Descriptions, Tag, Alert
} from 'antd';
import { 
  ArrowRightOutlined, 
  StopOutlined,
  UserOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { isLogin } from '../../utils/index';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function SessionView() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Check login and fetch session data
  useEffect(() => {
    const logined = isLogin();
    if (!logined) {
      message.warning('Not logged in');
      navigate('/login');
      return;
    }

    loadSessionData();
    
    // Refresh session data every 5 seconds if session is active
    const intervalId = setInterval(() => {
      if (sessionData && sessionData.status !== 'finished') {
        loadSessionData();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [sessionId, refreshCounter, navigate]);

  // Separate effect for handling player data
  useEffect(() => {
    if (sessionData && sessionData.status !== 'finished' && currentPlayerId) {
      loadCurrentQuestion();
    }
  }, [sessionData, currentPlayerId]);

  const loadSessionData = () => {
    setLoading(true);
    
    // Fetch session status
    get(`/admin/session/${sessionId}/status`)
      .then(res => {
        if (res && res.data) {
          setSessionData(res.data);
          
          // Also fetch session results (includes game and player data)
          get(`/admin/session/${sessionId}/results`)
            .then(resultsRes => {
              if (resultsRes && resultsRes.data) {
                setResultsData(resultsRes.data);
                
                // Set players if available in results
                if (resultsRes.data.players) {
                  setPlayers(resultsRes.data.players);
                }
              }
              setLoading(false);
            })
            .catch(err => {
              console.error('Failed to fetch session results:', err);
              setError('Failed to load session results');
              setLoading(false);
            });
        } else {
          setError('Invalid session data received');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch session data:', err);
        setError('Failed to load session data');
        setLoading(false);
      });
  };

  // Load current question info using the player API
  const loadCurrentQuestion = () => {
    if (!currentPlayerId) return;

    get(`/play/${currentPlayerId}/question`)
      .then(res => {
        if (res && res.data) {
          setCurrentQuestion(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch current question:', err);
      });
  };

  // Join as admin to control the session
  const joinAsAdmin = () => {
    const adminPlayer = {
      name: 'Admin Controller',
      sessionId: sessionId
    };
    
    post(`/play/join/${sessionId}`, adminPlayer)
      .then(res => {
        if (res && res.data && res.data.playerId) {
          setCurrentPlayerId(res.data.playerId);
          message.success('Joined session as admin controller');
        } else {
          message.error('Failed to join session');
        }
      })
      .catch(err => {
        console.error('Failed to join session:', err);
        message.error('Error joining session');
      });
  };

  // Advance to next question - simulated by submitting an answer
  const handleAdvance = () => {
    if (!currentPlayerId) {
      // If no playerId yet, join as admin first
      joinAsAdmin();
      message.info('Joining session as admin first...');
      return;
    }
    
    setLoading(true);
    put(`/play/${currentPlayerId}/answer`, {
      answer: "ADMIN_ADVANCE" // Special value indicating admin advance action
    })
      .then(res => {
        if (res) {
          message.success('Advanced to next question');
          // Force refresh
          setRefreshCounter(prev => prev + 1);
        } else {
          message.error('Failed to advance to next question');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to advance session:', err);
        message.error('Error advancing to next question');
        setLoading(false);
      });
  };

  // End session - could be implemented via a different player API call
  const handleEndSession = () => {
    setLoading(true);
    
    // Since there's no direct API for ending a session, we'll use the player API
    // with a special value to indicate ending the session
    if (!currentPlayerId) {
      joinAsAdmin();
      message.info('Joining session as admin first...');
      return;
    }
    
    put(`/play/${currentPlayerId}/answer`, {
      answer: "ADMIN_END_SESSION" // Special value for ending session
    })
      .then(res => {
        if (res) {
          message.success('Session ended successfully');
          // Force refresh
          setRefreshCounter(prev => prev + 1);
        } else {
          message.error('Failed to end session');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to end session:', err);
        message.error('Error ending session');
        setLoading(false);
      });
  };

  // Return to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Format session status for display
  const getStatusTag = (status) => {
    if (!status) return <Tag>Unknown</Tag>;
    
    switch(status.toLowerCase()) {
      case 'active':
        return <Tag color="green">Active</Tag>;
      case 'finished':
        return <Tag color="blue">Finished</Tag>;
      case 'waiting':
        return <Tag color="orange">Waiting</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Render current question information
  const renderCurrentQuestion = () => {
    if (!currentQuestion) {
      return <Alert message="No question information available" type="info" />;
    }
    
    return (
      <Card title="Current Question">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Question">{currentQuestion.text}</Descriptions.Item>
          <Descriptions.Item label="Type">{currentQuestion.type}</Descriptions.Item>
          <Descriptions.Item label="Duration">{currentQuestion.duration || 'N/A'} seconds</Descriptions.Item>
          <Descriptions.Item label="Points">{currentQuestion.points || 'Default'}</Descriptions.Item>
        </Descriptions>
        
        {currentQuestion.answers && currentQuestion.answers.length > 0 && (
          <>
            <Divider>Answer Options</Divider>
            <Table 
              dataSource={currentQuestion.answers.map((answer, index) => ({ 
                key: index, 
                option: String.fromCharCode(65 + index), // A, B, C, etc. 
                text: answer.text || answer,
                correct: answer.correct ? 'Yes' : 'No'
              }))} 
              columns={[
                { title: 'Option', dataIndex: 'option', key: 'option' },
                { title: 'Text', dataIndex: 'text', key: 'text' },
                { title: 'Correct', dataIndex: 'correct', key: 'correct' }
              ]}
              pagination={false}
              size="small"
            />
          </>
        )}
      </Card>
    );
  };

  // Render player list or statistics
  const renderPlayerInfo = () => {
    if (!players || players.length === 0) {
      return <Alert message="No players have joined yet" type="info" />;
    }
    
    return (
      <Card title={`Players (${players.length})`}>
        <Table 
          dataSource={players.map((player, index) => ({
            key: index,
            name: player.name,
            score: player.score || 0,
            status: player.status || 'Active'
          }))}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Score', dataIndex: 'score', key: 'score' },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: status => (
                status === 'Active' ? 
                <Tag color="green">Active</Tag> : 
                <Tag color="red">Disconnected</Tag>
              )
            }
          ]}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    );
  };

  if (loading && !sessionData) {
    return (
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src='/logo.svg' alt="Logo" style={{ height: 40 }} />
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Quizora</span>
          </div>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading session data..." />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src='/logo.svg' alt="Logo" style={{ height: 40 }} />
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Quizora</span>
          </div>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Alert 
            message="Error" 
            description={error}
            type="error" 
            showIcon
            action={
              <Button type="primary" onClick={goToDashboard}>
                Back to Dashboard
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

  // Get game name from results data if available
  const gameName = resultsData?.name || 'Unknown Game';
  
  // Get question progress information
  const questionCount = resultsData?.questions?.length || 0;
  const currentQuestionIndex = sessionData?.position || 0;

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src='/logo.svg' alt="Logo" style={{ height: 40 }} />
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Quizora</span>
        </div>
        <Button type="primary" onClick={goToDashboard} icon={<HomeOutlined />}>
          Dashboard
        </Button>
      </Header>
      
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Game Session: {gameName}</span>
                {getStatusTag(sessionData?.status)}
              </div>
            }
            extra={
              <Space>
                {sessionData?.status !== 'finished' && (
                  <>
                    <Button 
                      type="primary" 
                      icon={<ArrowRightOutlined />} 
                      onClick={handleAdvance}
                      loading={loading}
                    >
                      Next Question
                    </Button>
                    <Button 
                      danger
                      icon={<StopOutlined />} 
                      onClick={handleEndSession}
                      loading={loading}
                    >
                      End Session
                    </Button>
                  </>
                )}
                {sessionData?.status === 'finished' && (
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate('/dashboard')}
                  >
                    Start New Game
                  </Button>
                )}
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Session ID">{sessionId}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(sessionData?.status)}</Descriptions.Item>
              <Descriptions.Item label="Players">{players.length || 0}</Descriptions.Item>
              <Descriptions.Item label="Current Question">
                {currentQuestionIndex !== undefined ? 
                  `${currentQuestionIndex + 1} of ${questionCount}` : 
                  'Not started'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Time Remaining">
                {sessionData?.timeRemaining !== undefined ? 
                  `${sessionData.timeRemaining} seconds` : 
                  'N/A'
                }
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={sessionData?.status !== 'finished' ? 16 : 24}>
                {renderCurrentQuestion()}

                <div style={{ marginTop: 16 }}>
                  {renderPlayerInfo()}
                </div>
              </Col>
              
              {sessionData?.status !== 'finished' && (
                <Col xs={24} md={8}>
                  <Card title="Session Controls">
                    <div style={{ marginBottom: 20 }}>
                      <Text>Question Progress:</Text>
                      <Progress 
                        percent={
                          questionCount ? 
                          Math.round((currentQuestionIndex + 1) / questionCount * 100) : 
                          0
                        } 
                        status={sessionData?.status === 'finished' ? 'success' : 'active'} 
                      />
                    </div>
                    
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button 
                        type="primary" 
                        icon={<ArrowRightOutlined />} 
                        onClick={handleAdvance}
                        loading={loading}
                        block
                      >
                        Advance to Next Question
                      </Button>
                      <Button 
                        danger 
                        icon={<StopOutlined />} 
                        onClick={handleEndSession}
                        loading={loading}
                        block
                      >
                        End Session
                      </Button>
                    </Space>
                    
                    <Divider />
                    
                    <Alert
                      message="Session Information"
                      description="You can advance to the next question at any time, even if the current question's timer is still running."
                      type="info"
                      showIcon
                    />
                  </Card>
                </Col>
              )}
            </Row>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

// Fix - Adding missing post function
function post(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}

export default SessionView;
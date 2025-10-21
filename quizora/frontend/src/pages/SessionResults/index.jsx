import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post } from '../../utils/request';
import {
  Layout, Typography, Card, Table, Button, Space, Spin, message,
  Statistic, Row, Col, Divider, Progress
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ArrowRightOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function SessionResults() {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const [adminPlayerId, setAdminPlayerId] = useState(null);
  
  useEffect(() => {
    loadSessionData();
  }, [session_id]);
  
  const loadSessionData = () => {
    setLoading(true);
    
    get(`/admin/session/${session_id}/status`)
      .then(res => {
        console.log('Session status response:', res);
        if (res && res.data) {
          setSessionData(res.data);
          
          if (res.data.status === "finished") {
            loadResultData();
          } else {
            joinAsAdmin();
            setLoading(false);
          }
        } else {
          setError('Failed to load session data');
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Failed to load session data:', error);
        setError('Error loading session data');
        setLoading(false);
      });
  };
  
  const joinAsAdmin = () => {
    if (adminPlayerId) return;
    
    const adminPlayer = {
      name: 'Admin Controller',
    };
    
    post(`/play/join/${session_id}`, adminPlayer)
      .then(res => {
        console.log('Join as admin response:', res);
        if (res && res.data && res.data.playerId) {
          setAdminPlayerId(res.data.playerId);
        }
      })
      .catch(error => {
        console.error('Failed to join as admin:', error);
      });
  };
  
  const loadResultData = () => {
    if (!adminPlayerId) {
      const adminPlayer = {
        name: 'Admin Controller',
      };
      
      post(`/play/join/${session_id}`, adminPlayer)
        .then(res => {
          console.log('Join as admin response:', res);
          if (res && res.data && res.data.playerId) {
            const playerId = res.data.playerId;
            setAdminPlayerId(playerId);
            fetchResultsWithPlayerId(playerId);
          } else {
            setError('Failed to join session as admin');
            setLoading(false);
          }
        })
        .catch(error => {
          console.error('Failed to join as admin:', error);
          setError('Error joining session');
          setLoading(false);
        });
    } else {
      fetchResultsWithPlayerId(adminPlayerId);
    }
  };
  
  const fetchResultsWithPlayerId = (playerId) => {
    get(`/play/${playerId}/results`)
      .then(res => {
        console.log('Player results response:', res);
        
        // Handle the response which could be directly the array or in res.data
        const resultArray = Array.isArray(res) ? res : 
                           (res.data && Array.isArray(res.data) ? res.data : null);
        
        if (resultArray) {
          processResultData(resultArray);
        } else {
          setError('Failed to load session results - Invalid format');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load session results:', error);
        setError('Error loading session results');
        setLoading(false);
      });
  };
  
  const processResultData = (data) => {
    console.log('Processing result data:', data);
    
    if (!Array.isArray(data)) {
      console.error('Expected array of results but got:', data);
      setError('Invalid results data format');
      return;
    }
    
    const processedData = {
      players: [],
      questions: [],
      totalPlayers: 0,
      avgScore: 0,
      completionRate: 0
    };
    
    // Process the array of question results
    processedData.questions = data.map((answer, index) => {
      return {
        questionNumber: index + 1,
        content: `Question ${index + 1}`,
        correctCount: answer.correct ? 1 : 0,
        totalAttempts: 1,
        avgResponseTime: answer.answeredAt && answer.questionStartedAt ? 
          (new Date(answer.answeredAt) - new Date(answer.questionStartedAt)) / 1000 : 0
      };
    });
    
    // Calculate total score from correct answers
    const score = data.reduce((total, answer) => {
      return total + (answer.correct ? 10 : 0);
    }, 0);
    
    processedData.players = [{
      id: adminPlayerId,
      name: 'Your Result',
      score: score
    }];
    
    processedData.totalPlayers = 1;
    processedData.avgScore = score;
    processedData.completionRate = 100;
    
    setResultData(processedData);
  };
  
  const advanceToNextQuestion = () => {
    if (!adminPlayerId) {
      joinAsAdmin();
      message.info('Joining session as admin first...');
      return;
    }
    
    put(`/play/${adminPlayerId}/answer`, {
      answers: ["ADMIN_ADVANCE"]
    })
      .then(res => {
        console.log('Advance question response:', res);
        message.success('Advanced to next question');
        loadSessionData();
      })
      .catch(error => {
        console.error('Failed to advance question:', error);
        message.error('Failed to advance to next question');
      });
  };
  
  const stopGame = () => {
    if (!adminPlayerId) {
      joinAsAdmin();
      message.info('Joining session as admin first...');
      return;
    }
    
    put(`/play/${adminPlayerId}/answer`, {
      answers: ["ADMIN_END_SESSION"]
    })
      .then(res => {
        console.log('End session response:', res);
        message.success('Game session ended');
        loadSessionData();
      })
      .catch(error => {
        console.error('Failed to end game session:', error);
        message.error('Failed to end game session');
      });
  };
  
  const renderTopPlayersTable = () => {
    if (!resultData || !resultData.players || resultData.players.length === 0) {
      return (
        <Card title={<div><TrophyOutlined /> Top Players</div>} style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">No player data available</Text>
          </div>
        </Card>
      );
    }
    
    const topPlayers = [...resultData.players]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    const columns = [
      {
        title: 'Rank',
        key: 'rank',
        render: (_, __, index) => index + 1,
      },
      {
        title: 'Player',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Score',
        dataIndex: 'score',
        key: 'score',
        render: (score) => <strong>{score}</strong>
      }
    ];
    
    return (
      <Card title={<div><TrophyOutlined /> Top Players</div>} style={{ marginBottom: 24 }}>
        <Table 
          dataSource={topPlayers} 
          columns={columns} 
          rowKey="id" 
          pagination={false}
        />
      </Card>
    );
  };
  
  const renderCorrectAnswersChart = () => {
    if (!resultData || !resultData.questions || resultData.questions.length === 0) {
      return (
        <Card title="Correct Answers Percentage" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">No question data available</Text>
          </div>
        </Card>
      );
    }
    
    return (
      <Card title="Correct Answers Percentage" style={{ marginBottom: 24 }}>
        {resultData.questions.map((q, index) => {
          const percentage = (q.correctCount / q.totalAttempts) * 100 || 0;
          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Question {index + 1}</span>
                <span>{percentage.toFixed(1)}%</span>
              </div>
              <Progress 
                percent={percentage} 
                strokeColor="#52c41a" 
                trailColor="#f5f5f5"
                showInfo={false}
              />
            </div>
          );
        })}
      </Card>
    );
  };
  
  const renderResponseTimeChart = () => {
    if (!resultData || !resultData.questions || resultData.questions.length === 0) {
      return (
        <Card title={<div><ClockCircleOutlined /> Average Response Time</div>} style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">No response time data available</Text>
          </div>
        </Card>
      );
    }
    
    const maxTime = Math.max(...resultData.questions.map(q => q.avgResponseTime || 0)) || 10;
    
    return (
      <Card title={<div><ClockCircleOutlined /> Average Response Time</div>} style={{ marginBottom: 24 }}>
        {resultData.questions.map((q, index) => {
          const avgTime = q.avgResponseTime || 0;
          const timePercentage = (avgTime / maxTime) * 100;
          
          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Question {index + 1}</span>
                <span>{avgTime.toFixed(2)} seconds</span>
              </div>
              <Progress 
                percent={timePercentage} 
                strokeColor="#1890ff" 
                trailColor="#f5f5f5"
                showInfo={false}
              />
            </div>
          );
        })}
      </Card>
    );
  };
  
  const renderOverallStats = () => {
    if (!resultData) {
      return (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">No statistics available</Text>
          </div>
        </Card>
      );
    }
    
    return (
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic 
              title="Total Players" 
              value={resultData.totalPlayers || 0} 
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Average Score" 
              value={resultData.avgScore || 0} 
              precision={1}
              suffix="points"
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Completion Rate" 
              value={resultData.completionRate || 0} 
              precision={1}
              suffix="%"
            />
          </Col>
        </Row>
      </Card>
    );
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Session Results - {session_id}
        </Title>
        <Button type="primary" ghost onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Header>
      
      <Content style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Loading session data...</div>
          </div>
        ) : error ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Text type="danger">{error}</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        ) : sessionData && sessionData.status !== "finished" ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={4}>Game Session in Progress</Title>
              
              <div style={{ margin: '20px 0' }}>
                <Text>Current Question: {(sessionData.position || 0) + 1} of {sessionData.questions ? sessionData.questions.length : '?'}</Text>
                
                {sessionData.timeRemaining && (
                  <div style={{ marginTop: 8 }}>
                    <Text>Time Remaining: {sessionData.timeRemaining} seconds</Text>
                  </div>
                )}
              </div>
              
              <Space size="large">
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
                  onClick={stopGame}
                >
                  Stop Game
                </Button>
              </Space>
            </div>
          </Card>
        ) : (
          <div>
            <Title level={4}>Game Results</Title>
            
            {renderOverallStats()}
            
            {renderTopPlayersTable()}
            
            <Row gutter={24}>
              <Col span={12}>
                {renderCorrectAnswersChart()}
              </Col>
              <Col span={12}>
                {renderResponseTimeChart()}
              </Col>
            </Row>
          </div>
        )}
      </Content>
    </Layout>
  );
}

function put(url, data) {
  return fetch(url, {
    method: 'PUT',
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

export default SessionResults;
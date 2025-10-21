import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGameById, put, get } from '../../utils/request';
import {
    Typography, Layout, Button, Space, Card, Spin, message,
    Modal, Input, Select, Form, List, Popconfirm, Avatar, InputNumber,
    Checkbox, Radio, Divider, Row, Col
} from 'antd';
import { EditOutlined, DeleteOutlined, UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

export default function GamePage() {
    const { game_id } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [allGames, setAllGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [questionModalVisible, setQuestionModalVisible] = useState(false);
    const [metaModalVisible, setMetaModalVisible] = useState(false);
    const [questionForm] = Form.useForm();
    const [metaForm] = Form.useForm();
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
    const [questionType, setQuestionType] = useState('single');
    const [options, setOptions] = useState([{ id: 1, text: '' }]);
    const [correctOption, setCorrectOption] = useState(null);
    const [correctOptions, setCorrectOptions] = useState([]);
    const [judgementAnswer, setJudgementAnswer] = useState(null);

    // Load game data
    useEffect(() => {
        loadGameData();
    }, [game_id]);

    const loadGameData = () => {
        setLoading(true);
        get('/admin/games')
            .then(response => {
                const games = response.games || [];
                setAllGames(games);
                
                const currentGame = games.find(g => g.id === parseInt(game_id));
                if (currentGame) {
                    setGame(currentGame);
                } else {
                    message.error('Game not found');
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to load games:', error);
                message.error('Failed to load game data');
                setLoading(false);
            });
    };

    // Question management functions
    const showQuestionModal = (question = null, index = null) => {
        setSelectedQuestion(question);
        setSelectedQuestionIndex(index);
        
        // Reset form and options state
        resetOptionsState();
        
        if (question) {
            // Edit existing question
            const type = question.type || 'single';
            setQuestionType(type);
            
            // Prepare form fields
            const formFields = {
                content: question.content || '',
                duration: question.duration || 10,
                type: type,
                points: question.points || 10,
            };
            
            // Set up options based on question type
            if (type === 'single' || type === 'multiple') {
                if (question.options && question.options.length > 0) {
                    setOptions(question.options.map((opt, i) => ({ id: i + 1, text: opt })));
                    
                    if (type === 'single' && question.correctAnswers && question.correctAnswers.length > 0) {
                        const correctIndex = question.options.findIndex(opt => 
                            question.correctAnswers.includes(opt));
                        setCorrectOption(correctIndex !== -1 ? correctIndex + 1 : null);
                    } else if (type === 'multiple' && question.correctAnswers) {
                        const correctIndices = question.correctAnswers.map(ans => {
                            const index = question.options.findIndex(opt => opt === ans);
                            return index !== -1 ? index + 1 : null;
                        }).filter(idx => idx !== null);
                        setCorrectOptions(correctIndices);
                    }
                } else {
                    // Default options if none exist
                    setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
                }
            } else if (type === 'judgement') {
                if (question.correctAnswers && question.correctAnswers.length > 0) {
                    setJudgementAnswer(question.correctAnswers[0] === 'True' ? 'true' : 'false');
                }
            }
            
            // Set form values
            questionForm.setFieldsValue(formFields);
        } else {
            // Add new question - set defaults
            questionForm.setFieldsValue({
                type: 'single',
                duration: 10,
                points: 10
            });
            setQuestionType('single');
            setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
        }
        
        setQuestionModalVisible(true);
    };

    const resetOptionsState = () => {
        setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
        setCorrectOption(null);
        setCorrectOptions([]);
        setJudgementAnswer(null);
        setQuestionType('single');
    };

    const handleTypeChange = (value) => {
        setQuestionType(value);
        
        // Reset options based on type
        if (value === 'single' || value === 'multiple') {
            if (options.length < 2) {
                setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
            }
            
            if (value === 'single') {
                setCorrectOption(null);
            } else {
                setCorrectOptions([]);
            }
        } else if (value === 'judgement') {
            setJudgementAnswer(null);
        }
    };

    const addOption = () => {
        const newOptionId = options.length > 0 
            ? Math.max(...options.map(o => o.id)) + 1 
            : 1;
        setOptions([...options, { id: newOptionId, text: '' }]);
    };

    const removeOption = (id) => {
        if (options.length <= 2) {
            message.warning('At least two options are required');
            return;
        }
        
        setOptions(options.filter(o => o.id !== id));
        
        // Update correct options if needed
        if (questionType === 'single' && correctOption === id) {
            setCorrectOption(null);
        } else if (questionType === 'multiple') {
            setCorrectOptions(correctOptions.filter(o => o !== id));
        }
    };

    const handleOptionChange = (id, value) => {
        setOptions(options.map(o => o.id === id ? { ...o, text: value } : o));
    };

    const handleQuestionOk = () => {
        questionForm.validateFields()
            .then((values) => {
                // Validate options based on question type
                if (questionType === 'single' || questionType === 'multiple') {
                    const filledOptions = options.filter(o => o.text.trim() !== '');
                    if (filledOptions.length < 2) {
                        message.error('At least two filled options are required');
                        return;
                    }
                    
                    if (questionType === 'single' && correctOption === null) {
                        message.error('Please select a correct answer');
                        return;
                    } else if (questionType === 'multiple' && correctOptions.length === 0) {
                        message.error('Please select at least one correct answer');
                        return;
                    }
                } else if (questionType === 'judgement' && judgementAnswer === null) {
                    message.error('Please select a correct answer for the judgement question');
                    return;
                }
                
                // Create updated games array
                const updatedGames = [...allGames];
                const gameIndex = updatedGames.findIndex(g => g.id === parseInt(game_id));
                
                if (gameIndex === -1) {
                    message.error('Game not found');
                    return;
                }
                
                // Prepare the question object based on type
                let correctAnswersArray = [];
                let optionsArray = [];
                
                if (questionType === 'single' || questionType === 'multiple') {
                    optionsArray = options.map(o => o.text.trim()).filter(text => text !== '');
                    
                    if (questionType === 'single') {
                        const selectedOption = options.find(o => o.id === correctOption);
                        correctAnswersArray = selectedOption ? [selectedOption.text.trim()] : [];
                    } else { // multiple
                        correctAnswersArray = correctOptions.map(id => {
                            const option = options.find(o => o.id === id);
                            return option ? option.text.trim() : null;
                        }).filter(text => text !== null);
                    }
                } else if (questionType === 'judgement') {
                    optionsArray = ['True', 'False'];
                    correctAnswersArray = [judgementAnswer === 'true' ? 'True' : 'False'];
                }
                
                const questionObj = {
                    content: values.content,
                    duration: values.duration,
                    type: values.type,
                    points: values.points,
                    options: optionsArray,
                    correctAnswers: correctAnswersArray,
                };
                
                // Update or add the question
                if (selectedQuestion && selectedQuestionIndex !== null) {
                    // Update existing question
                    updatedGames[gameIndex].questions[selectedQuestionIndex] = {
                        ...updatedGames[gameIndex].questions[selectedQuestionIndex],
                        ...questionObj
                    };
                    message.success('Question updated successfully');
                } else {
                    // Add new question
                    if (!updatedGames[gameIndex].questions) {
                        updatedGames[gameIndex].questions = [];
                    }
                    updatedGames[gameIndex].questions.push(questionObj);
                    message.success('Question added successfully');
                }
                
                // Update game data on the server
                saveGamesData(updatedGames);
                
                // Reset and close
                questionForm.resetFields();
                setQuestionModalVisible(false);
                resetOptionsState();
            })
            .catch((errorInfo) => {
                console.log('Validation failed:', errorInfo);
            });
    };

    const handleQuestionCancel = () => {
        questionForm.resetFields();
        setQuestionModalVisible(false);
        resetOptionsState();
    };

    const handleDeleteQuestion = (index) => {
        const updatedGames = [...allGames];
        const gameIndex = updatedGames.findIndex(g => g.id === parseInt(game_id));
        
        if (gameIndex === -1) {
            message.error('Game not found');
            return;
        }
        
        updatedGames[gameIndex].questions.splice(index, 1);
        saveGamesData(updatedGames);
        message.success('Question deleted successfully');
    };

    // Game metadata functions
    const showMetaModal = () => {
        metaForm.setFieldsValue({
            name: game.name || '',
            thumbnail: game.thumbnail || ''
        });
        setMetaModalVisible(true);
    };

    const handleMetaOk = () => {
        metaForm.validateFields()
            .then((values) => {
                const updatedGames = [...allGames];
                const gameIndex = updatedGames.findIndex(g => g.id === parseInt(game_id));
                
                if (gameIndex === -1) {
                    message.error('Game not found');
                    return;
                }
                
                updatedGames[gameIndex] = {
                    ...updatedGames[gameIndex],
                    name: values.name,
                    thumbnail: values.thumbnail
                };
                
                saveGamesData(updatedGames);
                message.success('Game details updated successfully');
                metaForm.resetFields();
                setMetaModalVisible(false);
            })
            .catch((errorInfo) => {
                console.log('Validation failed:', errorInfo);
            });
    };

    const handleMetaCancel = () => {
        metaForm.resetFields();
        setMetaModalVisible(false);
    };

    // Save games data to backend
    const saveGamesData = (updatedGames) => {
        put('/admin/games', { games: updatedGames })
            .then(() => {
                loadGameData();
            })
            .catch(err => {
                console.error("Failed to save game data:", err);
                message.error('Failed to save changes. Please try again.');
            });
    };
        
    return(
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                    Quizora - Game Details
                </Title>
                <Space>
                    <Button type="primary" ghost onClick={() => navigate(`/game/${game_id}/question/new`)}>
                    Add Question
                    </Button>
                    <Button ghost onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </Space>
            </Header>        
            <Content style={{ padding: 24 }}>
                {loading ? (
                    <Spin tip="Loading..." />
                ) : game ? (
                    <>
                        <Card 
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{game.name || 'Untitled Game'}</span>
                                    <Button type="link" icon={<EditOutlined />} onClick={showMetaModal}>
                                        Edit Game Details
                                    </Button>
                                </div>
                            }
                            style={{ marginBottom: 24 }}
                        >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                                <div>
                                    {game.thumbnail ? (
                                        <img 
                                            src={game.thumbnail} 
                                            alt={game.name} 
                                            style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: 8 }} 
                                        />
                                    ) : (
                                        <div style={{ 
                                            width: 200, 
                                            height: 150, 
                                            background: '#f0f0f0', 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            borderRadius: 8
                                        }}>
                                            No Thumbnail
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p><Text strong>Number of Questions:</Text> {game.questions?.length || 0}</p>
                                    <p><Text strong>Game Status:</Text> {game.active ? 'Game ongoing' : 'Not started yet'}</p>
                                    <p><Text strong>Owner:</Text> {game.owner || 'Unknown'}</p>
                                    <Space style={{ marginTop: 16 }}>
                                        <Button type="primary">Start Game</Button>
                                    </Space>
                                </div>
                            </div>
                        </Card>

                        <Card title="Questions">
                            {game.questions && game.questions.length > 0 ? (
                                <List
                                    dataSource={game.questions}
                                    renderItem={(question, index) => (
                                        <List.Item
                                            key={index}
                                            actions={[
                                                <Button 
                                                icon={<EditOutlined />} 
                                                onClick={() => navigate(`/game/${game_id}/question/${question.id}`)}
                                                >
                                                Edit
                                                </Button>
                                                ,
                                                <Popconfirm
                                                    title="Are you sure you want to delete this question?"
                                                    onConfirm={() => handleDeleteQuestion(index)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Button danger icon={<DeleteOutlined />}>Delete</Button>
                                                </Popconfirm>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar>{index + 1}</Avatar>}
                                                title={
                                                    <div>
                                                        {question.content || `Question ${index + 1}`}
                                                        <Text type="secondary" style={{ marginLeft: 10 }}>
                                                            ({question.points || 10} points)
                                                        </Text>
                                                    </div>
                                                }
                                                description={
                                                    <>
                                                        <p>Type: {question.type || 'Not specified'}</p>
                                                        <p>Duration: {question.duration || 10} seconds</p>
                                                        <p>Options: {question.options ? question.options.join(', ') : 'None'}</p>
                                                        <p>Correct Answers: {question.correctAnswers?.join(', ') || 'None'}</p>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Text type="secondary">No questions yet. Click "Add Question" to create one.</Text>
                                </div>
                            )}
                        </Card>
                    </>
                ) : (
                    <Text type="danger">Game not found</Text>
                )}
            </Content>

            {/* Question Modal */}
            <Modal
                title={selectedQuestion ? "Edit Question" : "Add Question"}
                open={questionModalVisible}
                onOk={handleQuestionOk}
                onCancel={handleQuestionCancel}
                okText="Save"
                cancelText="Cancel"
                width={700}
            >
                <Form
                    form={questionForm}
                    layout="vertical"
                    name="question_form"
                >
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="content"
                                label="Question Content"
                                rules={[{ required: true, message: 'Please input question content!' }]}
                            >
                                <Input.TextArea rows={4} placeholder="Enter your question here" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="type"
                                label="Question Type"
                                rules={[{ required: true, message: 'Please select question type!' }]}
                            >
                                <Select 
                                    placeholder="Select question type" 
                                    onChange={handleTypeChange}
                                >
                                    <Option value="single">Single-choice</Option>
                                    <Option value="multiple">Multi-choice</Option>
                                    <Option value="judgement">True/False</Option>
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="duration"
                                label="Duration (seconds)"
                                rules={[{ required: true, message: 'Please input duration!' }]}
                            >
                                <InputNumber min={1} max={300} style={{ width: '100%' }} />
                            </Form.Item>
                            
                            <Form.Item
                                name="points"
                                label="Points"
                                rules={[{ required: true, message: 'Please input point value!' }]}
                            >
                                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider>Answer Options</Divider>
                    
                    {/* Options for Single and Multiple choice questions */}
                    {(questionType === 'single' || questionType === 'multiple') && (
                        <>
                            <List
                                dataSource={options}
                                renderItem={option => (
                                    <List.Item>
                                        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12 }}>
                                            {questionType === 'single' ? (
                                                <Radio 
                                                    checked={correctOption === option.id}
                                                    onChange={() => setCorrectOption(option.id)}
                                                />
                                            ) : (
                                                <Checkbox 
                                                    checked={correctOptions.includes(option.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setCorrectOptions([...correctOptions, option.id]);
                                                        } else {
                                                            setCorrectOptions(correctOptions.filter(id => id !== option.id));
                                                        }
                                                    }}
                                                />
                                            )}
                                            <Input 
                                                placeholder={`Option ${option.id}`}
                                                value={option.text}
                                                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <Button 
                                                type="text" 
                                                danger 
                                                icon={<MinusCircleOutlined />} 
                                                onClick={() => removeOption(option.id)}
                                            />
                                        </div>
                                    </List.Item>
                                )}
                                footer={
                                    <Button 
                                        type="dashed" 
                                        onClick={addOption} 
                                        block 
                                        icon={<PlusOutlined />}
                                    >
                                        Add Option
                                    </Button>
                                }
                            />
                            <div style={{ marginTop: 10, color: '#999' }}>
                                {questionType === 'single' 
                                    ? 'Select the radio button next to the correct answer' 
                                    : 'Check the boxes next to all correct answers'}
                            </div>
                        </>
                    )}
                    
                    {/* Options for Judgement questions */}
                    {questionType === 'judgement' && (
                        <div style={{ padding: '20px 0' }}>
                            <Text strong>Select the correct answer:</Text>
                            <div style={{ marginTop: 16 }}>
                                <Radio.Group 
                                    value={judgementAnswer} 
                                    onChange={(e) => setJudgementAnswer(e.target.value)}
                                >
                                    <Radio value="true">True</Radio>
                                    <Radio value="false">False</Radio>
                                </Radio.Group>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>

            {/* Game Metadata Modal */}
            <Modal
                title="Edit Game Details"
                open={metaModalVisible}
                onOk={handleMetaOk}
                onCancel={handleMetaCancel}
                okText="Save"
                cancelText="Cancel"
            >
                <Form
                    form={metaForm}
                    layout="vertical"
                    name="meta_form"
                >
                    <Form.Item
                        name="name"
                        label="Game Name"
                        rules={[{ required: true, message: 'Please input game name!' }]}
                    >
                        <Input placeholder="Enter game name" />
                    </Form.Item>
                    
                    <Form.Item
                        name="thumbnail"
                        label="Thumbnail URL"
                    >
                        <Input placeholder="Enter thumbnail URL" prefix={<UploadOutlined />} />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}
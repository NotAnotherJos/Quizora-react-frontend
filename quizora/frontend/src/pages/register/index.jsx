
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import {useNavigate, Link} from 'react-router-dom'
import {post} from '../../utils/request'

export default function Register(){
    const navigate = useNavigate();
    const onFinish = values => {
        console.log('Received values of form: ', values);
        const{ email, name, password, confirmPassword} = values;
        if (password != confirmPassword){
            message.error('Two passwords do not match');
            return;
        }
        const data = {
            email,
            name,
            password
        }
        post('/admin/auth/register',data)
            .then(res => {
                if(res && res.token){
                    localStorage.setItem('token',res.token);
                    navigate('/dashboard')
                }
            })
      };
    
      return (
        <Form
          name="register"
          initialValues={{ remember: true }}
          style={{ maxWidth: 360 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your Name!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Name" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: 'Please input your Password again!' }]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="ConfirmPassword" />
          </Form.Item>
    
          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Register
            </Button>
            or <Link to='/login'>Login now!</Link>
          </Form.Item>
        </Form>
      );
}
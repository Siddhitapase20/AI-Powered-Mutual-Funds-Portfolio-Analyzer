import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import api from '../utils/api';
import './Auth.css';

function Login(){
    const [form,setForm]=useState({email: '',password:''});
    const [error, setError]=useState('');
    const [loading, setLoading] =useState(false);
    const {login} =useAuth();
    const navigate=useNavigate();

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError('');
        setLoading(true);
        try{
            const res = await api.post('/auth/login');
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch(err){
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally{
            setLoading(false);
        }
    };

    return(
        <div className='auth-page'>
            <div className='auth-card'>
                <div className='auth-logo'>Fund<span>Sense</span></div>
                <h2 className='auth-title'>Welcome back</h2>
                <p className='auth-sub'>Login to your account</p>

                {error && <div className='alert alert-warning'>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label>Email</label>
                        <input 
                        type="email"
                        placeholder="you@exmaple.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value})}
                        required
                    />
                    </div>
                    <div className='form-group'>
                        <label> Password</label>
                        <input
                        type="Password"
                        placeholder="your password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value})}
                        required
                    />
                    </div>
                    <button className='btn btn-primary btn-full' type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login→'}
                    </button>s
                </form>
                <p className='auth-switch'>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );s
}
export default Login;
import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Register(){
    const [form, setForm] =useState({name: '',email:'', password:''});
    const [error, setError]= useState('');
    const [loading, setLoading]=useState('');
    const {login} =useAuth();
    const navigate = useNavigate();

    const handleSubmit=async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        setTimeout(() => {
            const mockUser = { name: form.name, email: form.email};
            const mockToken = 'mock-token-123';
            login(mockUser,mockToken);
            navigate('/dashboard');
            setLoading(false);
        }, 800);
    };

    return(
        <div className='auth-page'>
            <div className='auth-card'>
                <div className='auth-logo'>Fund<span>Sense</span></div>
                <h2 className='auth-title'>Create account</h2>
                <p className='auth-sub'>Start your free portfolio analysis</p>

                {error && <div className='alert alert-warning'>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label>Full name</label>
                        <input
                        type='text'
                        placeholder='Siddhi Tapase'
                        value={form.name}
                        onChange={e =>setForm({ ...form, name: e.target.value})}
                        required/>

                    </div>
                    <div className='form-group'>
                        <label>Email</label>
                        <input
                        type="email"
                        placeholder='you@exmaple.com'
                        value={form.email}
                        onChange={e => setForm({ ...form, email:e.target.value})}
                        required />

                    </div>
                    <div className='form-group'>
                        <label>Password</label>
                        <input 
                        type="password"
                        placeholder='Min 6 characters'
                        value={form.password}
                        onChange={e => setForm({ ...form, password:e.target.value})}
                        required
                        minLength={6}
                        />
                    </div>
                    <button className='btn btn-primary btn-full' type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account→"}
                    </button>
                </form>
                <p className='auth-switch'>
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
    
}
export default Register;
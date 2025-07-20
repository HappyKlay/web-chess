import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegister = async (username, email, password) => {
    try {
      setError('');
      const response = await fetch('http://localhost:8080/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password })
      });

      console.log(username, email, password);


      const data = await response.json();
      
      if (response.ok) {
        console.log('Registration successful:', data);
        navigate('/lobby');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
        console.error('Registration error:', data);
      }
    } catch (error) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <AuthLayout title="Register">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-sm bg-zinc-900/40 p-6 rounded-lg border border-zinc-800/50 shadow-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={(e) => { 
          e.preventDefault();
          handleRegister(formData.username, formData.email, formData.password);
        }}>

        <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
            className="w-full bg-zinc-800/30 border-b border-zinc-700/50 focus:border-zinc-500 outline-none pb-2 px-3 pt-2 text-zinc-300 placeholder-zinc-600 transition-colors rounded-t-md"
            placeholder="Enter your username"
            required
          />
        </div>
      </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-800/30 border-b border-zinc-700/50 focus:border-zinc-500 outline-none pb-2 px-3 pt-2 text-zinc-300 placeholder-zinc-600 transition-colors rounded-t-md"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-zinc-800/30 border-b border-zinc-700/50 focus:border-zinc-500 outline-none pb-2 px-3 pt-2 text-zinc-300 placeholder-zinc-600 transition-colors rounded-t-md"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button 
            type="submit" 
            className="w-full py-3 mt-6 bg-zinc-800 text-zinc-300 font-medium rounded-md hover:bg-zinc-700 border border-zinc-700/50 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Register
          </motion.button>

          <div className="text-center text-xs text-zinc-500 mt-6">
            Already have an account? <Link to="/Login" className="text-zinc-400 hover:text-zinc-300 transition-colors">Login</Link>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Register;

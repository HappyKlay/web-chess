import React from 'react';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="text-white min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1617083320253-92b730b58d20?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
      <div className="w-full max-w-md px-8 py-10 bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700/50 text-white">
        <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
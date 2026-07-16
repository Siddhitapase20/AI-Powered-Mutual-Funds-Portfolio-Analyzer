import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import './Sidebar.css';
import {
  FiHome,
  FiPieChart,
  FiTrendingUp,
  FiLayers,
  FiShuffle,
  FiDollarSign,
  FiShield,
  FiDownload
} from "react-icons/fi";

const NAV = [
  { section: 'Overview', links: [
    { to: '/dashboard', icon: '▦', label: 'Dashboard' },
    { to: '/portfolio', icon: '◈', label: 'Portfolio' },
    { to: '/fund-search', icon: '🔍', label: 'Fund Search' },  // NEW
  ]},
  { section: 'Analysis', links: [
    { to: '/performance', icon: '↗', label: 'Fund Performance' },
    { to: '/overlap', icon: '⊙', label: 'Overlap Checker' },
    { to: '/compare', icon: '⇌', label: 'Fund Comparison' },
  ]},
  { section: 'Planning', links: [
    { to: '/sip-tracker', icon: '📋', label: 'SIP Tracker' },   // NEW
    { to: '/sip', icon: '◎', label: 'SIP Calculator' },
    { to: '/risk', icon: '⚖', label: 'Risk Profile' },
  ]},
  { section: 'Export', links: [
    { to: '/export', icon: '↓', label: 'Export PDF' },
  ]},
];;

function Sidebar(){
    const { user, logout}=useAuth();
    const navigate=useNavigate();

    const handleLogout=()=>{
        logout();
        navigate('/');
    };

    return(
        <div className ="sidebar">
            <div className="sidebar-logo">
                Fund<span>Sense</span>
            </div>

            <div className="sidebar-user">
                <div className="sidebar-avatar">
                    {user?.name?.charAt(0).toUpperCase()||'U'}
                </div>
            <div>
                <div className="sidebar-name">{user?.name||'User'}</div>
                <div className="sidebar-email">{user?.email||''}</div>
            </div>
        </div>

        <nav className="sidebar-nav">
            {navItems.map((group)=>(
                <div key={group.section}>
                    <div className="sidebar-section">{group.section}</div>
                    {group.links.map((link)=>(
                        <NavLink
                          key={link.to}
                          to={link.to}
                          className={({isActive})=>
                        `sidebar-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="sidebar-icon">{link.icon}</span>
                        {link.label}
                    </NavLink>
                    ))}
                </div>
            ))}
        </nav>   
        <button className="sidebar-logout" onClick={handleLogout}>
        Logout
        </button>
    </div>

    );
}
export default Sidebar;
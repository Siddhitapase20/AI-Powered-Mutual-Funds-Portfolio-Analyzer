import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import './Sidebar.css';
import {
  FiHome,
  FiPieChart,
  FiTrendingUp,
  FiLayers,
  FiGitCompare,
  FiCalculator,
  FiShield,
  FiDownload
} from "react-icons/fi";

const navItems = [
  {
    section: "Overview",
    links: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: <FiHome />
      },
      {
        to: "/portfolio",
        label: "Portfolio",
        icon: <FiPieChart />
      }
    ]
  },
  {
    section: "Analysis",
    links: [
      {
        to: "/performance",
        label: "Fund Performance",
        icon: <FiTrendingUp />
      },
      {
        to: "/overlap",
        label: "Overlap Checker",
        icon: <FiLayers />
      },
      {
        to: "/compare",
        label: "Fund Comparison",
        icon: <FiGitCompare />
      }
    ]
  },
  {
    section: "Planning",
    links: [
      {
        to: "/sip",
        label: "SIP Calculator",
        icon: <FiCalculator />
      },
      {
        to: "/risk",
        label: "Risk Profile",
        icon: <FiShield />
      }
    ]
  },
  {
    section: "Export",
    links: [
      {
        to: "/export",
        label: "Export PDF",
        icon: <FiDownload />
      }
    ]
  }
];

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
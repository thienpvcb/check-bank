import { useState, useRef } from 'react';
import { Button, Typography, Checkbox, message } from 'antd';
import {
  SafetyCertificateOutlined, EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { LogoIcon } from '../../components/Icons';

const { Text } = Typography;

const LoginPage = () => {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [remember, setRemember]     = useState(true);
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState<{ username?: string; password?: string }>({});
  const [userFocus, setUserFocus]   = useState(false);
  const [passFocus, setPassFocus]   = useState(false);

  const passRef = useRef<HTMLInputElement>(null);

  const { login } = useAuthContext();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = (location.state as { from?: string })?.from || '/deposit';

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = 'Vui lòng nhập tên đăng nhập';
    if (!password)        e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(async () => {
      const result = await login(username, password);
      if (result.success) {
        message.success({ content: `Chào mừng, ${result.user.fullName}!`, duration: 2 });
        navigate(from, { replace: true });
      } else {
        setErrors({ password: result.message });
        setLoading(false);
      }
    }, 700);
  };

  // ── shared input style ──
  const inputBase: React.CSSProperties = {
    width: '100%',
    height: 50,
    background: '#1a2b3e',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e8edf5',
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    // kill autofill white bg
    WebkitTextFillColor: '#e8edf5',
    caretColor: '#4f8ef7',
  };

  return (
    <>
      {/* Global style to nuke autofill background */}
      <style>{`
        @keyframes autofill-fix {
          to {
            background: #1a2b3e;
            color: #e8edf5;
            -webkit-text-fill-color: #e8edf5;
          }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          animation-name: autofill-fix;
          animation-fill-mode: both;
          -webkit-box-shadow: 0 0 0 100px #1a2b3e inset !important;
          -webkit-text-fill-color: #e8edf5 !important;
          caret-color: #4f8ef7;
          border-radius: 10px;
        }
        .login-input::placeholder { color: #3d5269; }
        .login-input::-ms-reveal { display: none; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a1520 0%, #0f1e2e 50%, #0a1520 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: -160, right: -100, width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,142,247,0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -80, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Grid lines decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* ── Brand ── */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '12px 20px', marginBottom: 20,
            }}>
              <LogoIcon size={44} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#e8edf5', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>
                  CheckBank
                </div>
                <div style={{ color: '#4f8ef7', fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>
                  PAYMENT PORTAL
                </div>
              </div>
            </div>
            <div style={{ color: '#e8edf5', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
              Đăng nhập
            </div>
            <Text style={{ color: '#4a5f73', fontSize: 13 }}>
              Nạp · Rút · Theo dõi giao dịch
            </Text>
          </div>

          {/* ── Form card ── */}
          <div style={{
            background: 'rgba(24,34,48,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '32px 28px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}>
            <form onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', color: '#7a8fa6', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Tên đăng nhập
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: userFocus ? '#4f8ef7' : '#3d5269', transition: 'color 0.2s', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: undefined })); }}
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                    style={{
                      ...inputBase,
                      paddingLeft: 44, paddingRight: 16,
                      borderColor: errors.username ? '#ef4444' : userFocus ? '#4f8ef7' : 'rgba(255,255,255,0.1)',
                      boxShadow: userFocus ? '0 0 0 3px rgba(79,142,247,0.12)' : 'none',
                    }}
                  />
                </div>
                {errors.username && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {errors.username}
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ color: '#7a8fa6', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Mật khẩu
                  </label>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#4f8ef7', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    Quên mật khẩu?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: passFocus ? '#4f8ef7' : '#3d5269', transition: 'color 0.2s', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    ref={passRef}
                    className="login-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    style={{
                      ...inputBase,
                      paddingLeft: 44, paddingRight: 48,
                      borderColor: errors.password ? '#ef4444' : passFocus ? '#4f8ef7' : 'rgba(255,255,255,0.1)',
                      boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.10)' : passFocus ? '0 0 0 3px rgba(79,142,247,0.12)' : 'none',
                      letterSpacing: showPass ? 'normal' : password ? '0.15em' : 'normal',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: '#3d5269', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#7a8fa6')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#3d5269')}
                  >
                    {showPass
                      ? <EyeOutlined style={{ fontSize: 16 }} />
                      : <EyeInvisibleOutlined style={{ fontSize: 16 }} />}
                  </button>
                </div>
                {errors.password && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Remember */}
              <div style={{ marginBottom: 24 }}>
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ color: '#7a8fa6', fontSize: 13 }}
                >
                  Ghi nhớ đăng nhập
                </Checkbox>
              </div>

              {/* Submit */}
              <Button
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 50, fontWeight: 700, fontSize: 15, border: 'none',
                  background: loading ? '#2a3f5f' : 'linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)',
                  color: '#fff', borderRadius: 10,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(79,142,247,0.4)',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập →'}
              </Button>
            </form>
          </div>

          {/* Security note */}
          <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: '#2d4259', fontSize: 13 }} />
            <Text style={{ color: '#2d4259', fontSize: 12 }}>
              Kết nối SSL · Dữ liệu mô phỏng
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

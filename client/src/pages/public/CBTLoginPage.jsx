import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CBTLoginPage = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token.trim()) {
            setError('Please enter your exam token.');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/cbt/access-by-token', {
                token: token.trim().toUpperCase()
            });

            if (res.data.success) {
                // Store exam data in sessionStorage
                // sessionStorage clears when browser tab closes
                sessionStorage.setItem(
                    'cbt_exam_data',
                    JSON.stringify(res.data.data)
                );
                navigate('/cbt/exam');
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid token. Please check and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

                {/* LOGO */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🎓</div>
                    <h1 className="text-2xl font-bold text-purple-900"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Comforters' College
                    </h1>
                    <p className="text-purple-500 text-sm mt-1">
                        CBT Examination Portal
                    </p>
                </div>

                {/* INSTRUCTION */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
                    <p className="text-purple-700 text-sm text-center">
                        Enter the exam token given to you by your teacher to begin your examination.
                    </p>
                </div>

                {/* FORM */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-purple-800 mb-1">
                            Exam Token
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.toUpperCase())}
                            placeholder="e.g. EXM-2024-00123"
                            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg font-bold tracking-widest text-purple-900 uppercase"
                            disabled={loading}
                        />
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying Token...' : 'Start Examination'}
                    </button>
                </div>

                {/* FOOTER */}
                <p className="text-center text-purple-300 text-xs mt-6">
                    Do not share your token with anyone
                </p>
            </div>
        </div>
    );
};

export default CBTLoginPage;
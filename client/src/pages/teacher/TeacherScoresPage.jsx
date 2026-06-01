import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ScoresPage from '../admin/ScoresPage';

// Teachers use the same score entry page as admin
// but we wrap it with teacher context

const TeacherScoresPage = () => {
    return <ScoresPage />;
};

export default TeacherScoresPage;
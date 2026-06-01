import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { downloadQuestionTemplate, parseQuestionFile } from '../../utils/questionTemplate';

const BulkImportQuestionsModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [parseErrors, setParseErrors] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [importResults, setImportResults] = useState(null);

    // FETCH SUBJECTS
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            const res = await api.get('/academic/subjects');
            return res.data;
        }
    });

    // FETCH CLASSES
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await api.get('/academic/classes');
            return res.data;
        }
    });

    const subjects = subjectsData?.data ?? [];
    const classes = classesData?.data ?? [];

    // BULK IMPORT MUTATION
    const importMutation = useMutation({
        mutationFn: async (data) => {
            const results = { success: 0, failed: 0, errors: [] };

            for (const question of data.questions) {
                try {
                    await api.post('/cbt/questions', {
                        ...question,
                        subject_id: data.subject_id,
                        class_id: data.class_id
                    });
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        error.response?.data?.message || 'Unknown error'
                    );
                }
            }

            return results;
        },
        onSuccess: (results) => {
            setImportResults(results);
            setStep(4);
            if (results.success > 0) {
                onSuccess();
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Import failed.');
        }
    });

    // HANDLE FILE SELECTION
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        setFile(selectedFile);
        setParsedQuestions([]);
        setParseErrors([]);
    };

    // HANDLE FILE PARSING
    const handleParseFile = async () => {
        if (!file) {
            toast.error('Please select a file first.');
            return;
        }

        setIsParsing(true);
        try {
            const { questions, errors } = await parseQuestionFile(file);
            setParsedQuestions(questions);
            setParseErrors(errors);

            if (questions.length > 0) {
                setStep(3);
                toast.success(`${questions.length} questions ready to import.`);
            } else {
                toast.error('No valid questions found in file.');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsParsing(false);
        }
    };

    // HANDLE IMPORT
    const handleImport = () => {
        if (!selectedSubject || !selectedClass) {
            toast.error('Please select subject and class.');
            return;
        }

        importMutation.mutate({
            questions: parsedQuestions,
            subject_id: selectedSubject,
            class_id: selectedClass
        });
    };

    const difficultyColors = {
        easy: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        hard: 'bg-red-100 text-red-700'
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-purple-950"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Bulk Import Questions
                        </h2>
                        <p className="text-purple-400 text-sm mt-0.5">
                            Import multiple questions at once using Excel
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                    >
                        ✕
                    </button>
                </div>

                {/* STEP INDICATOR */}
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2 mb-6">
                        {[
                            { num: 1, label: 'Download Template' },
                            { num: 2, label: 'Upload File' },
                            { num: 3, label: 'Review & Import' },
                            { num: 4, label: 'Done' },
                        ].map((s, index) => (
                            <div key={s.num} className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        step > s.num
                                            ? 'bg-green-500 text-white'
                                            : step === s.num
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:block ${
                                        step === s.num
                                            ? 'text-purple-700'
                                            : 'text-gray-400'
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${
                                        step > s.num ? 'bg-green-400' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-6">

                    {/* STEP 1: DOWNLOAD TEMPLATE */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                                <div className="text-4xl mb-4">📥</div>
                                <h3 className="font-bold text-purple-900 mb-2"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Step 1: Download the Template
                                </h3>
                                <p className="text-purple-500 text-sm mb-4 leading-relaxed">
                                    Download the Excel template below. It contains
                                    sample questions showing you exactly how to fill
                                    each column. Fill in your questions and save the file.
                                </p>

                                {/* COLUMN GUIDE */}
                                <div className="bg-white rounded-xl p-4 border border-purple-100 mb-4">
                                    <p className="font-semibold text-purple-800 text-sm mb-3">
                                        Template Columns:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {[
                                            { col: 'question_text', desc: 'The full question' },
                                            { col: 'question_type', desc: 'multiple_choice or true_false' },
                                            { col: 'option_a', desc: 'First answer option' },
                                            { col: 'option_b', desc: 'Second answer option' },
                                            { col: 'option_c', desc: 'Third answer option' },
                                            { col: 'option_d', desc: 'Fourth answer option' },
                                            { col: 'correct_option', desc: 'a, b, c, d or true/false' },
                                            { col: 'explanation', desc: 'Why the answer is correct' },
                                            { col: 'marks', desc: 'Points for this question' },
                                            { col: 'difficulty_level', desc: 'easy, medium or hard' },
                                        ].map((item) => (
                                            <div key={item.col} className="flex gap-2">
                                                <span className="font-mono text-purple-600 font-medium">
                                                    {item.col}
                                                </span>
                                                <span className="text-gray-400">→ {item.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={downloadQuestionTemplate}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <span>📥</span>
                                    Download Excel Template
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    className="btn-primary"
                                >
                                    Next: Upload File →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: UPLOAD FILE */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.subject_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">Select class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* FILE UPLOAD AREA */}
                            <div className="form-group">
                                <label className="form-label">
                                    Upload Excel File <span className="text-red-500">*</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                    file
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50'
                                }`}>
                                    <div className="text-center p-4">
                                        {file ? (
                                            <>
                                                <div className="text-4xl mb-2">✅</div>
                                                <p className="text-green-700 font-medium text-sm">
                                                    {file.name}
                                                </p>
                                                <p className="text-green-500 text-xs mt-1">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                                <p className="text-green-500 text-xs mt-1">
                                                    Click to change file
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-4xl mb-2">📤</div>
                                                <p className="text-purple-600 font-medium text-sm">
                                                    Click to upload Excel file
                                                </p>
                                                <p className="text-purple-400 text-xs mt-1">
                                                    .xlsx or .xls files only
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* PARSE ERRORS */}
                            {parseErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="font-semibold text-red-700 text-sm mb-2">
                                        ⚠️ {parseErrors.length} error(s) found:
                                    </p>
                                    <ul className="space-y-1">
                                        {parseErrors.map((error, i) => (
                                            <li key={i} className="text-red-600 text-xs">
                                                • {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="btn-secondary"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleParseFile}
                                    disabled={!file || isParsing || !selectedSubject || !selectedClass}
                                    className="btn-primary"
                                >
                                    {isParsing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Reading file...
                                        </span>
                                    ) : (
                                        'Read File →'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW AND IMPORT */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-purple-900">
                                        {parsedQuestions.length} questions ready to import
                                    </p>
                                    <p className="text-purple-400 text-sm">
                                        Review the questions below before importing
                                    </p>
                                </div>
                                {parseErrors.length > 0 && (
                                    <span className="badge-warning">
                                        {parseErrors.length} rows skipped
                                    </span>
                                )}
                            </div>

                            {/* SELECTED INFO */}
                            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 flex gap-4 text-sm">
                                <div>
                                    <span className="text-purple-400">Subject: </span>
                                    <span className="font-medium text-purple-900">
                                        {subjects.find(s => s.id === selectedSubject)?.subject_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-purple-400">Class: </span>
                                    <span className="font-medium text-purple-900">
                                        {classes.find(c => c.id === selectedClass)?.class_name}
                                    </span>
                                </div>
                            </div>

                            {/* QUESTIONS PREVIEW */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                                <table className="table text-xs">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Question</th>
                                            <th>Type</th>
                                            <th>Answer</th>
                                            <th>Difficulty</th>
                                            <th>Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedQuestions.map((q, index) => (
                                            <tr key={index}>
                                                <td className="text-purple-400">
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <p className="max-w-xs truncate text-purple-900">
                                                        {q.question_text}
                                                    </p>
                                                </td>
                                                <td>
                                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full capitalize text-xs">
                                                        {q.question_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="font-bold text-purple-700 uppercase">
                                                    {q.correct_option}
                                                </td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded-full capitalize text-xs font-medium ${
                                                        difficultyColors[q.difficulty_level]
                                                    }`}>
                                                        {q.difficulty_level}
                                                    </span>
                                                </td>
                                                <td className="text-purple-700 font-medium">
                                                    {q.marks}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ERRORS WARNING */}
                            {parseErrors.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                    <p className="text-yellow-700 text-sm font-medium mb-1">
                                        ⚠️ {parseErrors.length} rows were skipped due to errors:
                                    </p>
                                    <ul className="text-yellow-600 text-xs space-y-0.5">
                                        {parseErrors.slice(0, 5).map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                        {parseErrors.length > 5 && (
                                            <li>...and {parseErrors.length - 5} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(2)}
                                    className="btn-secondary"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importMutation.isPending}
                                    className="btn-primary"
                                >
                                    {importMutation.isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Importing {parsedQuestions.length} questions...
                                        </span>
                                    ) : (
                                        `Import ${parsedQuestions.length} Questions`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DONE */}
                    {step === 4 && importResults && (
                        <div className="space-y-4">
                            <div className={`rounded-2xl p-6 text-center ${
                                importResults.failed === 0
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                                <div className="text-5xl mb-3">
                                    {importResults.failed === 0 ? '🎉' : '⚠️'}
                                </div>
                                <h3 className="font-bold text-lg mb-2"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {importResults.failed === 0
                                        ? 'Import Successful!'
                                        : 'Import Completed with Errors'
                                    }
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mt-4 max-w-xs mx-auto">
                                    <div className="bg-white rounded-xl p-3 border border-green-200">
                                        <p className="text-2xl font-bold text-green-600">
                                            {importResults.success}
                                        </p>
                                        <p className="text-green-500 text-xs">
                                            Successfully imported
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-red-200">
                                        <p className="text-2xl font-bold text-red-600">
                                            {importResults.failed}
                                        </p>
                                        <p className="text-red-500 text-xs">
                                            Failed
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {importResults.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-700 text-sm font-medium mb-2">
                                        Failed Questions:
                                    </p>
                                    <ul className="text-red-600 text-xs space-y-1">
                                        {importResults.errors.map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                {importResults.failed > 0 && (
                                    <button
                                        onClick={() => {
                                            setStep(1);
                                            setFile(null);
                                            setParsedQuestions([]);
                                            setParseErrors([]);
                                            setImportResults(null);
                                        }}
                                        className="btn-secondary"
                                    >
                                        Import Again
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="btn-primary"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkImportQuestionsModal;
import * as XLSX from 'xlsx';

// ============================================
// GENERATE QUESTION BANK TEMPLATE
// ============================================
export const downloadQuestionTemplate = () => {

    // SAMPLE DATA
    const templateData = [
        {
            question_text: 'What is the capital of Nigeria?',
            question_type: 'multiple_choice',
            option_a: 'Lagos',
            option_b: 'Abuja',
            option_c: 'Kano',
            option_d: 'Ibadan',
            correct_option: 'b',
            explanation: 'Abuja became the capital of Nigeria in 1991',
            marks: 1,
            difficulty_level: 'easy'
        },
        {
            question_text: 'The sun rises from the west',
            question_type: 'true_false',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_option: 'false',
            explanation: 'The sun rises from the east not the west',
            marks: 1,
            difficulty_level: 'easy'
        },
        {
            question_text: 'Solve for x: 2x + 4 = 10',
            question_type: 'multiple_choice',
            option_a: 'x = 2',
            option_b: 'x = 3',
            option_c: 'x = 4',
            option_d: 'x = 5',
            correct_option: 'b',
            explanation: '2x = 10 - 4 = 6, therefore x = 3',
            marks: 2,
            difficulty_level: 'medium'
        },
        {
            question_text: 'Explain the process of photosynthesis and state two products',
            question_type: 'multiple_choice',
            option_a: 'Glucose and Oxygen',
            option_b: 'Carbon dioxide and Water',
            option_c: 'Nitrogen and Glucose',
            option_d: 'Oxygen and Carbon dioxide',
            correct_option: 'a',
            explanation: 'Photosynthesis produces Glucose and Oxygen as products',
            marks: 3,
            difficulty_level: 'hard'
        },
        {
            question_text: 'Water is a compound',
            question_type: 'true_false',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_option: 'true',
            explanation: 'Water (H2O) is a compound made of Hydrogen and Oxygen',
            marks: 1,
            difficulty_level: 'easy'
        },
    ];

    // INSTRUCTIONS SHEET
    const instructions = [
        ['QUESTION BANK IMPORT TEMPLATE'],
        ['Comforters College School Management System'],
        [''],
        ['======= INSTRUCTIONS ======='],
        [''],
        ['1. Do NOT delete or rename the column headers in the Questions sheet'],
        ['2. Fill your questions starting from ROW 2 in the Questions sheet'],
        ['3. Each row = one question'],
        [''],
        ['======= COLUMN GUIDE ======='],
        [''],
        ['COLUMN', 'WHAT TO WRITE', 'EXAMPLE'],
        ['question_text', 'The full question text', 'What is 2 + 2?'],
        ['question_type', 'Type of question', 'multiple_choice OR true_false'],
        ['option_a', 'First answer option (multiple choice only)', 'Lagos'],
        ['option_b', 'Second answer option (multiple choice only)', 'Abuja'],
        ['option_c', 'Third answer option (multiple choice only)', 'Kano'],
        ['option_d', 'Fourth answer option (multiple choice only)', 'Ibadan'],
        ['correct_option', 'The correct answer', 'a OR b OR c OR d OR true OR false'],
        ['explanation', 'Why the answer is correct (optional)', 'Abuja became capital in 1991'],
        ['marks', 'HOW MANY MARKS THIS QUESTION CARRIES', '1 OR 2 OR 3 OR 5'],
        ['difficulty_level', 'How hard the question is', 'easy OR medium OR hard'],
        [''],
        ['======= MARKS GUIDE ======='],
        [''],
        ['marks = 1', 'Simple recall questions (easy)'],
        ['marks = 2', 'Understanding questions (medium)'],
        ['marks = 3', 'Application questions (medium/hard)'],
        ['marks = 4', 'Analysis questions (hard)'],
        ['marks = 5', 'Complex problem solving (hard)'],
        [''],
        ['NOTE: Each question can have a DIFFERENT mark value'],
        ['NOTE: The total exam marks is the SUM of all question marks'],
        [''],
        ['======= VALID VALUES ======='],
        [''],
        ['question_type', 'multiple_choice', '(4 options A B C D)'],
        ['question_type', 'true_false', '(only True or False, leave options empty)'],
        [''],
        ['correct_option', 'a', '(for option A)'],
        ['correct_option', 'b', '(for option B)'],
        ['correct_option', 'c', '(for option C)'],
        ['correct_option', 'd', '(for option D)'],
        ['correct_option', 'true', '(for True/False questions)'],
        ['correct_option', 'false', '(for True/False questions)'],
        [''],
        ['difficulty_level', 'easy'],
        ['difficulty_level', 'medium'],
        ['difficulty_level', 'hard'],
        [''],
        ['======= IMPORTANT NOTES ======='],
        [''],
        ['- All text in correct_option must be LOWERCASE (a, b, c, d, true, false)'],
        ['- For true_false questions leave option_a to option_d EMPTY'],
        ['- The explanation column is optional but helps students learn'],
        ['- Save the file as .xlsx before uploading'],
    ];

    // CREATE WORKBOOK
    const wb = XLSX.utils.book_new();

    // QUESTIONS SHEET
    const questionsWs = XLSX.utils.json_to_sheet(templateData);
    questionsWs['!cols'] = [
        { wch: 70 }, // question_text
        { wch: 20 }, // question_type
        { wch: 35 }, // option_a
        { wch: 35 }, // option_b
        { wch: 35 }, // option_c
        { wch: 35 }, // option_d
        { wch: 15 }, // correct_option
        { wch: 55 }, // explanation
        { wch: 10 }, // marks
        { wch: 15 }, // difficulty_level
    ];

    // INSTRUCTIONS SHEET
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    instructionsWs['!cols'] = [
        { wch: 20 },
        { wch: 45 },
        { wch: 35 }
    ];

    // ADD SHEETS
    // Instructions first so it opens first
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'READ ME FIRST');
    XLSX.utils.book_append_sheet(wb, questionsWs, 'Questions');

    // DOWNLOAD
    XLSX.writeFile(wb, 'comforters_college_question_template.xlsx');
};


// ============================================
// PARSE IMPORTED QUESTIONS FILE
// ============================================
export const parseQuestionFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // FIND QUESTIONS SHEET
                const sheetName = workbook.SheetNames.find(
                    name => name.toLowerCase().includes('question')
                ) || workbook.SheetNames[workbook.SheetNames.length - 1];

                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    reject(new Error('No questions found. Make sure you filled the Questions sheet.'));
                    return;
                }

                const questions = [];
                const errors = [];

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2;

                    // VALIDATE REQUIRED FIELDS
                    if (!row.question_text) {
                        errors.push(`Row ${rowNum}: question_text is empty`);
                        return;
                    }

                    if (!row.question_type) {
                        errors.push(`Row ${rowNum}: question_type is empty`);
                        return;
                    }

                    const qType = String(row.question_type).trim().toLowerCase();

                    if (!['multiple_choice', 'true_false'].includes(qType)) {
                        errors.push(`Row ${rowNum}: question_type must be multiple_choice or true_false`);
                        return;
                    }

                    if (!row.correct_option) {
                        errors.push(`Row ${rowNum}: correct_option is empty`);
                        return;
                    }

                    const correctOpt = String(row.correct_option).toLowerCase().trim();
                    const validOptions = qType === 'multiple_choice'
                        ? ['a', 'b', 'c', 'd']
                        : ['true', 'false'];

                    if (!validOptions.includes(correctOpt)) {
                        errors.push(`Row ${rowNum}: correct_option "${row.correct_option}" is invalid for ${qType}`);
                        return;
                    }

                    // VALIDATE MARKS
                    const marks = row.marks ? parseFloat(row.marks) : 1;
                    if (isNaN(marks) || marks <= 0) {
                        errors.push(`Row ${rowNum}: marks must be a positive number`);
                        return;
                    }

                    // VALIDATE DIFFICULTY
                    const difficulty = row.difficulty_level
                        ? String(row.difficulty_level).toLowerCase().trim()
                        : 'medium';

                    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                        errors.push(`Row ${rowNum}: difficulty_level must be easy, medium or hard`);
                        return;
                    }

                    // BUILD QUESTION OBJECT
                    questions.push({
                        question_text: String(row.question_text).trim(),
                        question_type: qType,
                        option_a: row.option_a ? String(row.option_a).trim() : null,
                        option_b: row.option_b ? String(row.option_b).trim() : null,
                        option_c: row.option_c ? String(row.option_c).trim() : null,
                        option_d: row.option_d ? String(row.option_d).trim() : null,
                        correct_option: correctOpt,
                        explanation: row.explanation
                            ? String(row.explanation).trim()
                            : null,
                        marks,
                        difficulty_level: difficulty
                    });
                });

                resolve({ questions, errors });

            } catch (error) {
                reject(new Error('Failed to read the file. Make sure it is a valid Excel file (.xlsx).'));
            }
        };

        reader.onerror = () => reject(new Error('Could not read the file.'));
        reader.readAsArrayBuffer(file);
    });
};
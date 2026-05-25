import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();


// ============================================
// ADD BOOK TO LIBRARY
// ============================================
export const addBook = async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            publisher,
            publication_year,
            edition,
            category,
            subject_id,
            class_level,
            description,
            cover_image_url,
            file_url,
            book_type,
            total_copies
        } = req.body;

        if (!title || !book_type) {
            return res.status(400).json({
                success: false,
                message: 'Title and book type are required.'
            });
        }

        // Check if ISBN already exists
        if (isbn) {
            const existing = await db.query(
                `SELECT id FROM library_books WHERE isbn = $1`,
                [isbn]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'A book with this ISBN already exists.'
                });
            }
        }

        const copies = parseInt(total_copies) || 1;

        const result = await db.query(
            `INSERT INTO library_books (
                title, author, isbn, publisher,
                publication_year, edition, category,
                subject_id, class_level, description,
                cover_image_url, file_url, book_type,
                total_copies, available_copies, added_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *`,
            [
                title, author || null, isbn || null,
                publisher || null, publication_year || null,
                edition || null, category || null,
                subject_id || null, class_level || 'General',
                description || null, cover_image_url || null,
                file_url || null, book_type,
                copies, copies, req.user.id
            ]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'added_book',
                'library',
                'library_books',
                result.rows[0].id,
                `Added book: ${title}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Book added to library successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Add book error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL BOOKS
// ============================================
export const getAllBooks = async (req, res) => {
    try {
        const {
            search,
            category,
            book_type,
            class_level,
            subject_id,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = ['b.is_active = TRUE'];
        let values = [];
        let counter = 1;

        if (search) {
            conditions.push(
                `(b.title ILIKE $${counter}
                OR b.author ILIKE $${counter}
                OR b.isbn ILIKE $${counter})`
            );
            values.push(`%${search}%`);
            counter++;
        }

        if (category) {
            conditions.push(`b.category = $${counter}`);
            values.push(category);
            counter++;
        }

        if (book_type) {
            conditions.push(`b.book_type = $${counter}`);
            values.push(book_type);
            counter++;
        }

        if (class_level) {
            conditions.push(`b.class_level = $${counter}`);
            values.push(class_level);
            counter++;
        }

        if (subject_id) {
            conditions.push(`b.subject_id = $${counter}`);
            values.push(subject_id);
            counter++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT b.*,
                    s.subject_name
             FROM library_books b
             LEFT JOIN subjects s ON s.id = b.subject_id
             ${whereClause}
             ORDER BY b.title ASC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM library_books b ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all books error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET SINGLE BOOK
// ============================================
export const getSingleBook = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT b.*,
                    s.subject_name
             FROM library_books b
             LEFT JOIN subjects s ON s.id = b.subject_id
             WHERE b.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get single book error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// UPDATE BOOK
// ============================================
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            author,
            publisher,
            category,
            description,
            cover_image_url,
            file_url,
            total_copies,
            is_active
        } = req.body;

        const bookQuery = await db.query(
            `SELECT id FROM library_books WHERE id = $1`,
            [id]
        );

        if (bookQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        const result = await db.query(
            `UPDATE library_books SET
                title = COALESCE($1, title),
                author = COALESCE($2, author),
                publisher = COALESCE($3, publisher),
                category = COALESCE($4, category),
                description = COALESCE($5, description),
                cover_image_url = COALESCE($6, cover_image_url),
                file_url = COALESCE($7, file_url),
                total_copies = COALESCE($8, total_copies),
                is_active = COALESCE($9, is_active),
                updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [
                title || null, author || null,
                publisher || null, category || null,
                description || null, cover_image_url || null,
                file_url || null,
                total_copies ? parseInt(total_copies) : null,
                is_active !== undefined ? is_active : null,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Book updated successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update book error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// BORROW BOOK
// ============================================
export const borrowBook = async (req, res) => {
    try {
        const {
            book_id,
            borrower_id,
            borrower_type,
            due_date
        } = req.body;

        if (!book_id || !borrower_id || !borrower_type || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'Book, borrower, borrower type and due date are required.'
            });
        }

        // Check book exists and has available copies
        const bookQuery = await db.query(
            `SELECT id, title, available_copies, book_type
             FROM library_books
             WHERE id = $1 AND is_active = TRUE`,
            [book_id]
        );

        if (bookQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found.'
            });
        }

        const book = bookQuery.rows[0];

        if (book.book_type === 'ebook') {
            return res.status(400).json({
                success: false,
                message: 'Ebooks cannot be borrowed. They can be read directly.'
            });
        }

        if (book.available_copies <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No copies available for borrowing.'
            });
        }

        // Check if borrower already has this book
        const existingBorrow = await db.query(
            `SELECT id FROM book_borrowings
             WHERE book_id = $1
             AND borrower_id = $2
             AND borrow_status = 'borrowed'`,
            [book_id, borrower_id]
        );

        if (existingBorrow.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This borrower already has this book.'
            });
        }

        const result = await db.query(
            `INSERT INTO book_borrowings (
                book_id, borrower_id, borrower_type,
                due_date, issued_by
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                book_id, borrower_id, borrower_type,
                due_date, req.user.id
            ]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'borrowed_book',
                'library',
                'book_borrowings',
                result.rows[0].id,
                `Book borrowed: ${book.title}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Book borrowed successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Borrow book error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// RETURN BOOK
// ============================================
export const returnBook = async (req, res) => {
    try {
        const { borrowing_id } = req.params;
        const { remarks, fine_amount } = req.body;

        const borrowingQuery = await db.query(
            `SELECT bb.*, lb.title
             FROM book_borrowings bb
             LEFT JOIN library_books lb ON lb.id = bb.book_id
             WHERE bb.id = $1`,
            [borrowing_id]
        );

        if (borrowingQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Borrowing record not found.'
            });
        }

        const borrowing = borrowingQuery.rows[0];

        if (borrowing.borrow_status === 'returned') {
            return res.status(400).json({
                success: false,
                message: 'This book has already been returned.'
            });
        }

        const result = await db.query(
            `UPDATE book_borrowings SET
                borrow_status = 'returned',
                returned_date = CURRENT_DATE,
                received_by = $1,
                fine_amount = COALESCE($2, fine_amount),
                remarks = COALESCE($3, remarks),
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [
                req.user.id,
                fine_amount || null,
                remarks || null,
                borrowing_id
            ]
        );

        await db.query(
            `INSERT INTO audit_logs
             (user_id, user_role, action, module,
              target_table, target_id, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                req.user.role,
                'returned_book',
                'library',
                'book_borrowings',
                borrowing_id,
                `Book returned: ${borrowing.title}`
            ]
        );

        return res.status(200).json({
            success: true,
            message: 'Book returned successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Return book error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET ALL BORROWINGS
// ============================================
export const getAllBorrowings = async (req, res) => {
    try {
        const {
            borrow_status,
            borrower_type,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = [];
        let values = [];
        let counter = 1;

        if (borrow_status) {
            conditions.push(`bb.borrow_status = $${counter}`);
            values.push(borrow_status);
            counter++;
        }

        if (borrower_type) {
            conditions.push(`bb.borrower_type = $${counter}`);
            values.push(borrower_type);
            counter++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT bb.*,
                    lb.title, lb.author,
                    s.first_name AS student_first_name,
                    s.last_name AS student_last_name,
                    s.admission_number,
                    t.first_name AS teacher_first_name,
                    t.last_name AS teacher_last_name,
                    t.staff_id
             FROM book_borrowings bb
             LEFT JOIN library_books lb ON lb.id = bb.book_id
             LEFT JOIN students s ON s.user_id = bb.borrower_id
             LEFT JOIN teachers t ON t.user_id = bb.borrower_id
             ${whereClause}
             ORDER BY bb.borrowed_date DESC
             LIMIT $${counter} OFFSET $${counter + 1}`,
            [...values, limit, offset]
        );

        const countQuery = await db.query(
            `SELECT COUNT(*) FROM book_borrowings bb ${whereClause}`,
            values
        );

        const total = parseInt(countQuery.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get borrowings error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET OVERDUE BOOKS
// ============================================
export const getOverdueBooks = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT bb.*,
                    lb.title, lb.author,
                    s.first_name AS student_first_name,
                    s.last_name AS student_last_name,
                    s.admission_number,
                    t.first_name AS teacher_first_name,
                    t.last_name AS teacher_last_name,
                    CURRENT_DATE - bb.due_date AS days_overdue
             FROM book_borrowings bb
             LEFT JOIN library_books lb ON lb.id = bb.book_id
             LEFT JOIN students s ON s.user_id = bb.borrower_id
             LEFT JOIN teachers t ON t.user_id = bb.borrower_id
             WHERE bb.borrow_status IN ('borrowed', 'overdue')
             AND bb.due_date < CURRENT_DATE
             ORDER BY days_overdue DESC`
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get overdue books error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};


// ============================================
// GET BORROWING HISTORY FOR A USER
// ============================================
export const getUserBorrowingHistory = async (req, res) => {
    try {
        const { user_id } = req.params;

        const result = await db.query(
            `SELECT bb.*,
                    lb.title, lb.author,
                    lb.cover_image_url
             FROM book_borrowings bb
             LEFT JOIN library_books lb ON lb.id = bb.book_id
             WHERE bb.borrower_id = $1
             ORDER BY bb.borrowed_date DESC`,
            [user_id]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Get borrowing history error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};
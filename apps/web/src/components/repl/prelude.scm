;; (λ Qijun) 的机关。英文的撇号就是 Lisp 的 quote：
;; (qijun's posts) 读作 (qijun 's posts)，(what's new) 读作 (what 's new)。

(define-macro (λ . body) `(lambda ,@body))

;; 文章是数据：(post 标题 日期 类型 地址)
(define (title p) (list-ref p 1))
(define (date p) (list-ref p 2))
(define (kind p) (list-ref p 3))
(define (url p) (list-ref p 4))
(define (essay? p) (eq? (kind p) 'essay))
(define (take xs n) (if (or (= n 0) (null? xs)) '() (cons (car xs) (take (cdr xs) (- n 1)))))

(define (open p) (js-open (url p)))

;; 问句。宏拿到的词不求值，所以 new、this、qijun 不用事先定义。
(define-macro (qijun s thing)
  (case thing
    ((posts) '(js-posts))
    ((blog lab read github) `(js-go ',thing))
    (else `(js-unknown 'qijun ',thing))))

(define-macro (what s thing)
  (case thing
    ((new) '(take (js-posts) 3))
    ((this) '(js-help))
    (else `(js-unknown 'what ',thing))))

(define-macro (who s thing)
  (case thing
    ((qijun) '(js-who))
    (else `(js-unknown 'who ',thing))))

(define-macro (where s thing)
  (case thing
    ((qijun) '(js-where))
    (else `(js-unknown 'where ',thing))))

;; slogan
(define math 'math)
(define (study x) `(study ,x))
(define (practice x) `(,x (practice code)))
(define (code body) `(λ () ,@body))
(define-macro (-> x . fs)
  (if (null? fs) x
      (let ((f (car fs)))
        `(-> ,(if (pair? f) `(,(car f) ,x ,@(cdr f)) `(,f ,x)) ,@(cdr fs)))))

(define (source) (js-source))

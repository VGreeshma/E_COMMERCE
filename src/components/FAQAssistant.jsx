
import { useState } from 'react';
import './FAQAssistant.css';

const faqs = [
  {
    question: 'How can I place an order?',
    answer: 'Browse products, add your favourite items to the cart and proceed to checkout to place your order.'
  },
  {
    question: 'What payment methods are available?',
    answer: 'HappyKart supports Cash on Delivery (COD). You can pay when your order is delivered.'
  },
  {
    question: 'How can I add products to my cart?',
    answer: 'Click the Add to Cart button on a product. You can view, update or remove products from your Cart page.'
  },
  {
    question: 'Can I change my delivery address?',
    answer: 'You can enter your delivery address during checkout. Please verify your address before confirming your order.'
  },
  {
    question: 'How can I track my order?',
    answer: 'After order tracking is implemented, you will be able to check your order status from the My Orders page.'
  },
  {
    question: 'How can I contact customer support?',
    answer: 'For assistance, please contact the HappyKart support team through the contact details provided by the store.'
  }
];

function FAQAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);

  return (
    <div className="faq-assistant">

      {isOpen && (
        <div className="faq-window">

          <div className="faq-header">
            <div>
              <h5>HappyKart Assistant 🤖</h5>
              <small>How can I help you today?</small>
            </div>

            <button
              className="faq-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="faq-body">
            <p>
              Hello! 👋 Welcome to HappyKart.
              Select a question below.
            </p>

            {faqs.map((faq, index) => (
              <div className="faq-item" key={index}>
                <button
                  className="faq-question"
                  onClick={() =>
                    setSelectedFAQ(
                      selectedFAQ === index ? null : index
                    )
                  }
                >
                  {faq.question}
                  <span>{selectedFAQ === index ? '−' : '+'}</span>
                </button>

                {selectedFAQ === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-footer">
            HappyKart Customer Support
          </div>

        </div>
      )}

      <button
        className="faq-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close ' : '💬 Help'}
      </button>

    </div>
  );
}

export default FAQAssistant;

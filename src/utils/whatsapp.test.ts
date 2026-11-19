import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIndianPhone,
  isValidIndianPhone,
  formatIndianPhone,
  buildWhatsAppLink,
  buildProductWhatsAppMessage,
  buildFarmerEnquiryReplyMessage,
  buildBuyerEnquiryFollowUpMessage,
} from './whatsapp';

test('normalizes valid Indian mobile numbers', () => {
  assert.equal(normalizeIndianPhone('9437120451'), '919437120451');
  assert.equal(normalizeIndianPhone('+91 94371 20451'), '919437120451');
  assert.equal(normalizeIndianPhone('098611-45290'), '919861145290');
  assert.equal(normalizeIndianPhone('919861145290'), '919861145290');
});

test('rejects invalid phone numbers', () => {
  assert.equal(normalizeIndianPhone('12345'), null);
  assert.equal(normalizeIndianPhone('5123456789'), null); // Doesn't start with 6-9
  assert.equal(normalizeIndianPhone(''), null);
  assert.equal(isValidIndianPhone('not-a-phone'), false);
  assert.equal(buildWhatsAppLink('12345'), null);
});

test('generates valid WhatsApp wa.me link with encoded prefilled text', () => {
  const link = buildWhatsAppLink('+91 94371 20451');
  assert.ok(link?.startsWith('https://wa.me/919437120451?text='));
  assert.ok(link?.includes(encodeURIComponent('FreshKart Agro Connect')));

  const formatted = formatIndianPhone('9437120451');
  assert.equal(formatted, '+91 94371 20451');

  const msg = buildProductWhatsAppMessage('Tomato', 'Ramesh Sahu', '₹20/Kg');
  assert.ok(msg.includes('Ramesh Sahu'));
  assert.ok(msg.includes('Tomato'));

  const farmerReply = buildFarmerEnquiryReplyMessage(
    'Sharma Grocery Store',
    'Tomato',
    '200 Kg',
    '₹20/Kg'
  );
  assert.ok(farmerReply.includes('Sharma Grocery Store'));
  assert.ok(farmerReply.includes('200 Kg'));

  const buyerFollowUp = buildBuyerEnquiryFollowUpMessage('Ramesh Sahu', 'Tomato', '200 Kg');
  assert.ok(buyerFollowUp.includes('Ramesh Sahu'));
  assert.ok(buyerFollowUp.includes('purchase enquiry'));
});

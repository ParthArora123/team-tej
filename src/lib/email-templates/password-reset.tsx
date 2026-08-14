import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  resetUrl?: string
  expiresInMinutes?: number
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const heading = { fontSize: '24px', lineHeight: '1.25', color: '#141414', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.7', color: '#333333', margin: '0 0 14px' }
const button = {
  backgroundColor: '#141414',
  color: '#ffffff',
  borderRadius: '999px',
  padding: '14px 28px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '10px 0 18px',
}
const small = { fontSize: '13px', lineHeight: '1.6', color: '#6b6b6b', margin: '0 0 10px' }
const hr = { borderColor: '#e6e2db', margin: '26px 0 16px' }

const PasswordResetEmail = ({ name, resetUrl, expiresInMinutes = 30 }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Reset Password</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          We received a request to reset the password for your account. Click the button below to
          choose a new password.
        </Text>
        <Button style={button} href={resetUrl || '#'}>
          Reset Password
        </Button>
        <Text style={small}>
          This link expires in {expiresInMinutes} minutes and can only be used once.
        </Text>
        <Text style={small}>
          If you didn&apos;t request a password reset, you can safely ignore this email — your
          password stays unchanged.
        </Text>
        <Hr style={hr} />
        <Text style={small}>Tejas D Dhoke</Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: PasswordResetEmail,
  subject: 'Reset your password',
  displayName: 'Password reset',
  previewData: {
    name: 'Aarav',
    resetUrl: 'https://tejasdhoke.com/reset-password?token=example',
    expiresInMinutes: 30,
  },
}

export default PasswordResetEmail

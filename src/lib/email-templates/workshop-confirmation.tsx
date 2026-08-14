import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  participantName?: string
  workshopName?: string
  workshopDate?: string
  workshopTime?: string
  venue?: string
  ticketId?: string
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const heading = { fontSize: '24px', lineHeight: '1.25', color: '#141414', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '1.7', color: '#333333', margin: '0 0 14px' }
const detailBox = {
  backgroundColor: '#f6f4f0',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '20px 0',
}
const detailLine = { fontSize: '15px', lineHeight: '1.7', color: '#222222', margin: '0' }
const label = { color: '#6b6b6b' }
const hr = { borderColor: '#e6e2db', margin: '26px 0 16px' }
const signature = { fontSize: '15px', color: '#141414', margin: '0' }

const WorkshopConfirmationEmail = ({
  participantName,
  workshopName,
  workshopDate,
  workshopTime,
  venue,
  ticketId,
}: Props) => {
  const name = participantName || 'there'
  const workshop = workshopName || 'the workshop'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your registration for ${workshop} is confirmed.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Registration Confirmed</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Your registration for {workshop} has been successfully confirmed.
          </Text>

          <Section style={detailBox}>
            <Text style={detailLine}>
              <span style={label}>Workshop: </span>
              {workshop}
            </Text>
            {workshopDate ? (
              <Text style={detailLine}>
                <span style={label}>Date: </span>
                {workshopDate}
              </Text>
            ) : null}
            {workshopTime ? (
              <Text style={detailLine}>
                <span style={label}>Time: </span>
                {workshopTime}
              </Text>
            ) : null}
            {venue ? (
              <Text style={detailLine}>
                <span style={label}>Venue: </span>
                {venue}
              </Text>
            ) : null}
            {ticketId ? (
              <Text style={detailLine}>
                <span style={label}>Registration / Ticket ID: </span>
                {ticketId}
              </Text>
            ) : null}
            <Text style={detailLine}>
              <span style={label}>Payment Status: </span>
              Confirmed
            </Text>
          </Section>

          <Text style={text}>
            Please keep your ticket/QR code available for the workshop.
          </Text>

          <Hr style={hr} />
          <Text style={signature}>Thank you,</Text>
          <Text style={signature}>Tejas D Dhoke</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WorkshopConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Registration Confirmed — ${data?.['workshopName'] || 'Workshop'}`,
  displayName: 'Workshop registration confirmation',
  previewData: {
    participantName: 'Aarav',
    workshopName: 'Bollywood Intensive',
    workshopDate: 'Sat, 20 Sep 2026',
    workshopTime: '3:00 PM',
    venue: 'Studio One, Pune',
    ticketId: 'TTJ-8F2K1A',
  },
} satisfies TemplateEntry

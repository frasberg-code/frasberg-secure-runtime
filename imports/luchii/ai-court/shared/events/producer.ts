import { Kafka, Producer } from "kafkajs";

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (producer) return producer;

  const kafka = new Kafka({
    clientId: "ai-court",
    brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  });

  producer = kafka.producer();
  await producer.connect();

  return producer;
}

export async function publishEvent(topic: string, message: any) {
  const prod = await getProducer();
  await prod.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
}

export const Topics = {
  CASE_CREATED: "court.case.created",
  CASE_UPDATED: "court.case.updated",
  EVIDENCE_UPLOADED: "court.evidence.uploaded",
  INTEGRITY_REQUESTED: "court.evidence.integrity.requested",
  INTEGRITY_COMPLETED: "court.evidence.integrity.completed",
  AUDIT_EVENT: "court.audit.event",
  GOVERNANCE_ALERT: "court.governance.alert",
} as const;

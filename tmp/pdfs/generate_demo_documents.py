from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "output" / "pdf"
PUBLIC_DIR = ROOT / "public" / "documents"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

DOCUMENTS = [
    {
        "filename": "kbis-comptoir-vert.pdf",
        "title": "Extrait d'immatriculation",
        "subtitle": "Le Comptoir Vert",
        "reference": "RF-DEMO-KBIS-0101",
        "rows": [
            ("Raison sociale", "Le Comptoir Vert"),
            ("Responsable", "Clara Dubois"),
            ("SIRET", "812 345 678 00019"),
            ("Activité", "Épicerie responsable"),
            ("Adresse", "28 Rue de Marseille, 69007 Lyon"),
        ],
    },
    {
        "filename": "justificatif-local-comptoir-vert.pdf",
        "title": "Justificatif de local commercial",
        "subtitle": "Le Comptoir Vert",
        "reference": "RF-DEMO-LOCAL-0101",
        "rows": [
            ("Titulaire", "Le Comptoir Vert"),
            ("Adresse du local", "28 Rue de Marseille, 69007 Lyon"),
            ("Usage", "Commerce de proximité"),
            ("Début d'occupation", "15 janvier 2026"),
            ("Émetteur", "Bailleur Démonstration RelayFlow"),
        ],
    },
    {
        "filename": "identite-nina-roux.pdf",
        "title": "Justificatif d'identité",
        "subtitle": "Nina Roux",
        "reference": "RF-DEMO-ID-0102",
        "rows": [
            ("Nom", "Roux"),
            ("Prénom", "Nina"),
            ("Date de naissance", "12 avril 1996"),
            ("Nationalité", "Française"),
            ("Document", "Carte nationale d'identité - exemple"),
        ],
    },
    {
        "filename": "activite-nina-roux.pdf",
        "title": "Justificatif d'activité professionnelle",
        "subtitle": "Nina Roux",
        "reference": "RF-DEMO-ACT-0102",
        "rows": [
            ("Statut", "Auto-entrepreneur"),
            ("Activité", "Livraison urbaine"),
            ("Zone principale", "Lyon 3e et Lyon 7e"),
            ("Véhicule", "Vélo électrique"),
            ("Assurance", "Attestation de démonstration valide"),
        ],
    },
    {
        "filename": "permis-yanis-benali.pdf",
        "title": "Permis de conduire",
        "subtitle": "Yanis Benali",
        "reference": "RF-DEMO-PERMIS-0103",
        "rows": [
            ("Nom", "Benali"),
            ("Prénom", "Yanis"),
            ("Catégorie", "A1 / B"),
            ("Numéro", "DEMO-69-2026-1842"),
            ("Validité", "Document d'exemple"),
        ],
    },
    {
        "filename": "carte-grise-yanis-benali.pdf",
        "title": "Certificat d'immatriculation",
        "subtitle": "Véhicule de Yanis Benali",
        "reference": "RF-DEMO-CG-0103",
        "rows": [
            ("Immatriculation", "GT-482-PQ"),
            ("Type", "Scooter"),
            ("Marque", "Peugeot"),
            ("Modèle", "Kisbee 125"),
            ("Titulaire", "Yanis Benali"),
        ],
    },
]


def build_document(document):
    destination = OUTPUT_DIR / document["filename"]
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleRelayFlow",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=27,
        textColor=colors.HexColor("#111827"),
        spaceAfter=5 * mm,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleRelayFlow",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=colors.HexColor("#4F46E5"),
        spaceAfter=8 * mm,
    )
    notice_style = ParagraphStyle(
        "NoticeRelayFlow",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#92400E"),
        backColor=colors.HexColor("#FEF3C7"),
        borderColor=colors.HexColor("#F59E0B"),
        borderWidth=0.6,
        borderPadding=7,
        spaceAfter=10 * mm,
    )
    body_style = ParagraphStyle(
        "BodyRelayFlow",
        parent=styles["Normal"],
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#475569"),
    )

    story = [
        Paragraph("RELAY<span color='#4F46E5'>FLOW</span>", title_style),
        Paragraph(document["title"], title_style),
        Paragraph(document["subtitle"], subtitle_style),
        Paragraph(
            "DOCUMENT D'EXEMPLE - SANS VALEUR JURIDIQUE<br/>"
            "Créé uniquement pour tester l'ouverture des justificatifs dans RelayFlow.",
            notice_style,
        ),
    ]

    table_data = [["Information", "Valeur"], *document["rows"]]
    table = Table(table_data, colWidths=[55 * mm, 105 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3730A3")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#334155")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend(
        [
            table,
            Spacer(1, 12 * mm),
            Paragraph(
                f"Référence du document : {document['reference']}<br/>"
                "Ce fichier contient des données entièrement fictives destinées à la démonstration.",
                body_style,
            ),
        ]
    )

    pdf = SimpleDocTemplate(
        str(destination),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=document["title"],
        author="RelayFlow - données de démonstration",
    )
    pdf.build(story)
    (PUBLIC_DIR / document["filename"]).write_bytes(destination.read_bytes())


for item in DOCUMENTS:
    build_document(item)

print(f"{len(DOCUMENTS)} documents créés dans {PUBLIC_DIR}")
